using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MassTransit; 
using OrderPaymentService.Data;
using OrderPaymentService.Models;
using OrderPaymentService.Events;
using OrderPaymentService.Services; // Import Service Firebase

namespace OrderPaymentService.Controllers
{
    [Route("api/orders")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPublishEndpoint _publishEndpoint;
        private readonly NotificationService _notificationService; // Service gửi thông báo
        private readonly ILogger<OrderController> _logger;        // Logger để ghi lỗi

        // Inject đầy đủ các dịch vụ
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

        // 1. GET: api/orders?tenantId=1
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

        // 2. POST: api/orders (Tạo đơn hàng + RabbitMQ an toàn)
        [HttpPost]
        public async Task<ActionResult<Order>> CreateOrder(Order order)
        {
            // Validate dữ liệu
            if (order.TenantId <= 0) return BadRequest("Invalid TenantId");
            
            // Set giá trị mặc định
            order.CreatedAt = DateTime.UtcNow;
            order.Status = "Pending";

            // A. LƯU DATABASE (Bắt buộc phải thành công)
            try 
            {
                _context.Orders.Add(order);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Lỗi nghiêm trọng: Không thể lưu đơn hàng vào DB");
                return StatusCode(500, "Lỗi Database: " + ex.Message);
            }

            // B. GỬI RABBITMQ (Tính năng phụ - Nếu lỗi thì bỏ qua, không làm sập app)
            try
            {
                await _publishEndpoint.Publish(new OrderCreatedEvent
                {
                    OrderId = order.Id,
                    TenantId = order.TenantId,
                    TableId = order.TableId,
                    TotalAmount = order.TotalAmount,
                    CreatedAt = order.CreatedAt,
                    Status = order.Status
                });
            }
            catch (Exception ex)
            {
                // Chỉ ghi log warning màu vàng, vẫn cho khách đặt món thành công
                _logger.LogWarning("⚠️ Cảnh báo: Không thể gửi tin nhắn sang RabbitMQ. Lỗi: " + ex.Message);
            }

            return CreatedAtAction(nameof(GetOrders), new { id = order.Id }, order);
        }

        // 3. PUT: api/orders/{id}/status (Cập nhật trạng thái + Firebase an toàn)
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromQuery] string status, [FromQuery] int tenantId)
        {
            var order = await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
            
            if (order == null) return NotFound();
            if (tenantId > 0 && order.TenantId != tenantId) return Unauthorized();

            // Cập nhật DB
            order.Status = status;
            await _context.SaveChangesAsync();

            // LOGIC FIREBASE: Nếu trạng thái là "Completed" -> Bắn thông báo
            if (status == "Completed" && !string.IsNullOrEmpty(order.DeviceToken))
            {
                try 
                {
                    string firstItemName = order.Items.FirstOrDefault()?.MenuItemName ?? "món ăn";
                    
                    // Gọi service bắn tin (Fire & Forget - Không chờ đợi để response nhanh)
                    _ = _notificationService.SendOrderCompletedAsync(order.DeviceToken, order.Id, firstItemName);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("⚠️ Cảnh báo: Lỗi khi gửi Firebase Notification. Lỗi: " + ex.Message);
                }
            }

            return Ok(order);
        }
    }
}