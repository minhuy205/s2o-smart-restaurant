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

        // 2. POST: Tạo đơn hàng (Dùng DTO để nhận Token chuẩn xác + Fix giờ VN)
        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto request)
        {
            // Debug log để kiểm tra token
            Console.WriteLine($"[API] 📩 Nhận đơn bàn: {request.TableName} | Token: {request.DeviceToken}");

            if (request.TenantId <= 0) return BadRequest("Invalid TenantId");

            // A. Map từ DTO sang Model Order (Thủ công để kiểm soát dữ liệu)
            var newOrder = new Order
            {
                TenantId = request.TenantId,
                TableId = request.TableId,
                TableName = request.TableName,
                TotalAmount = request.TotalAmount,
                Status = "Pending",
                
                // 🔥 SỬA LỖI GIỜ: Cộng thêm 7 tiếng để ra giờ Việt Nam
                CreatedAt = DateTime.UtcNow.AddHours(7), 
                
                // Gán Token từ request vào Order để lưu DB
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

            // B. Lưu vào Database
            try 
            {
                _context.Orders.Add(newOrder);
                await _context.SaveChangesAsync();
                
                // C. Gửi thông báo xác nhận ngay (Test luôn xem Token sống không)
                if (!string.IsNullOrEmpty(newOrder.DeviceToken))
                {
                   _ = _notificationService.SendNotificationAsync(
                        newOrder.DeviceToken, 
                        "Đã nhận đơn! 👨‍🍳", 
                        $"Bếp đang chuẩn bị {newOrder.Items.Count} món cho bạn."
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Lỗi lưu đơn hàng vào Database");
                return StatusCode(500, "Lỗi Database: " + ex.Message);
            }

            // D. Gửi sự kiện sang RabbitMQ (để các service khác biết)
            try
            {
                await _publishEndpoint.Publish(new OrderCreatedEvent
                {
                    OrderId = newOrder.Id,
                    TenantId = newOrder.TenantId,
                    TableId = newOrder.TableId,
                    TotalAmount = newOrder.TotalAmount,
                    // Giờ này đã là giờ VN do đã gán ở trên
                    CreatedAt = newOrder.CreatedAt, 
                    Status = newOrder.Status
                });
            }
            catch (Exception ex)
            {
                // Chỉ ghi log warning màu vàng, vẫn cho khách đặt món thành công
                _logger.LogWarning("⚠️ Lỗi gửi RabbitMQ (vẫn cho qua): " + ex.Message);
            }

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

            // LOGIC FIREBASE: Nếu trạng thái là "Completed" -> Bắn thông báo
            if (status == "Completed" && !string.IsNullOrEmpty(order.DeviceToken))
            {
                string firstItemName = order.Items.FirstOrDefault()?.MenuItemName ?? "món ăn";
                
                // Gọi service bắn tin (Fire & Forget)
                _ = _notificationService.SendOrderCompletedAsync(order.DeviceToken, order.Id, firstItemName);
            }

            return Ok(order);
        }
    }

    // --- CÁC CLASS DTO (Data Transfer Object) ---
    // Dùng để hứng dữ liệu JSON chính xác từ Frontend
    public class CreateOrderDto
    {
        public int TenantId { get; set; }
        public int TableId { get; set; }
        public string TableName { get; set; }
        public decimal TotalAmount { get; set; }
        
        // Đây là biến quan trọng nhất để hứng token
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