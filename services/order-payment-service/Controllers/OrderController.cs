using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MassTransit; 
using OrderPaymentService.Data;
using OrderPaymentService.Models;
using OrderPaymentService.Events;
using OrderPaymentService.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace OrderPaymentService.Controllers
{
    [Route("api/orders")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPublishEndpoint _publishEndpoint;
        private readonly NotificationService _notificationService;
        private readonly ILogger<OrderController> _logger;

        public OrderController(
            AppDbContext context, 
            IPublishEndpoint publishEndpoint,
            NotificationService notificationService,
            ILogger<OrderController> logger)
        {
            _context = context;
            _publishEndpoint = publishEndpoint;
            _notificationService = notificationService;
            _logger = logger;
        }

        // 1. GET: Lấy danh sách đơn
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Order>>> GetOrders([FromQuery] int tenantId)
        {
            if (tenantId <= 0) return BadRequest("Missing TenantId");

            return await _context.Orders
                .Include(o => o.Items)
                .Where(o => o.TenantId == tenantId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        // 2. POST: Tạo đơn hàng
        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto request)
        {
            // Debug log
            Console.WriteLine($"[API] 📩 Nhận đơn bàn: {request.TableName} | Tenant: {request.TenantId}");

            if (request.TenantId <= 0) return BadRequest("Invalid TenantId");

            // A. Chuẩn bị dữ liệu Order
            var newOrder = new Order
            {
                TenantId = request.TenantId,
                TableId = request.TableId,
                TableName = request.TableName,
                TotalAmount = request.TotalAmount,
                Status = "Pending",
                
                // Giờ Việt Nam (UTC + 7)
                CreatedAt = DateTime.UtcNow, 
                
                // Lưu Token để dùng sau này (báo món xong)
                DeviceToken = request.DeviceToken, 

                Items = new List<OrderItem>()
            };

            if (request.Items != null)
            {
                foreach (var item in request.Items)
                {
                    newOrder.Items.Add(new OrderItem
                    {
                        MenuItemName = item.MenuItemName,
                        Quantity = item.Quantity,
                        Price = item.Price,
                        Note = item.Note
                    });
                }
            }

            // B. Lưu vào Database (BẮT BUỘC PHẢI ĐỢI XONG)
            try 
            {
                _context.Orders.Add(newOrder);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Lỗi Database");
                return StatusCode(500, "Lỗi lưu đơn hàng: " + ex.Message);
            }

            // --- PHẦN CHẠY NGẦM (FIRE AND FORGET) ĐỂ TRÁNH LAG ---

            // C. Gửi thông báo Firebase (Chạy ngầm)
            if (!string.IsNullOrEmpty(newOrder.DeviceToken))
            {
                _ = _notificationService.SendNotificationAsync(
                    newOrder.DeviceToken, 
                    "Đã nhận đơn! 👨‍🍳", 
                    $"Bếp đang chuẩn bị {newOrder.Items.Count} món cho bạn."
                );
            }

            // D. Gửi sự kiện RabbitMQ (Chạy ngầm luôn cho chắc ăn)
            // Dùng Task.Run để đẩy ra luồng riêng, không làm chậm API
            _ = Task.Run(async () => 
            {
                try 
                {
                    await _publishEndpoint.Publish(new OrderCreatedEvent
                    {
                        OrderId = newOrder.Id,
                        TenantId = newOrder.TenantId,
                        TableId = newOrder.TableId,
                        TotalAmount = newOrder.TotalAmount,
                        CreatedAt = newOrder.CreatedAt, 
                        Status = newOrder.Status
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"⚠️ Lỗi gửi RabbitMQ (Order {newOrder.Id}): {ex.Message}");
                }
            });

            // E. Trả về kết quả ngay lập tức
            return Ok(new { message = "Đặt món thành công", orderId = newOrder.Id });
        }

        // 3. PUT: Cập nhật trạng thái
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromQuery] string status, [FromQuery] int tenantId)
        {
            var order = await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
            
            if (order == null) return NotFound();
            if (tenantId > 0 && order.TenantId != tenantId) return Unauthorized();

            order.Status = status;
            await _context.SaveChangesAsync();

            // LOGIC FIREBASE: Nếu xong món -> Bắn thông báo (Chạy ngầm)
            if (status == "Completed" && !string.IsNullOrEmpty(order.DeviceToken))
            {
                string firstItemName = order.Items.FirstOrDefault()?.MenuItemName ?? "món ăn";
                
                // Fire & Forget
                _ = _notificationService.SendOrderCompletedAsync(order.DeviceToken, order.Id, firstItemName);
            }

            return Ok(order);
        }
    }

    // --- DTO CLASSES ---
    public class CreateOrderDto
    {
        public int TenantId { get; set; }
        public int TableId { get; set; }
        public string TableName { get; set; }
        public decimal TotalAmount { get; set; }
        public string DeviceToken { get; set; } 
        public List<OrderItemDto> Items { get; set; }
    }

    public class OrderItemDto
    {
        public string MenuItemName { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public string Note { get; set; }
    }
}