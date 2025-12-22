using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MassTransit;
using OrderPaymentService.Data;
using OrderPaymentService.Models;
using OrderPaymentService.Events; // Đảm bảo bạn đã tạo file Event ở bước trước

namespace OrderPaymentService.Controllers
{
    // Đường dẫn API sẽ là: /api/orders (giống hệt code cũ để Frontend không bị lỗi)
    [Route("api/orders")] 
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPublishEndpoint _publishEndpoint; // Cái này để bắn tin nhắn RabbitMQ

        // Inject Database và RabbitMQ vào Controller
        public OrderController(AppDbContext context, IPublishEndpoint publishEndpoint)
        {
            _context = context;
            _publishEndpoint = publishEndpoint;
        }

        // 1. GET: api/orders?tenantId=1 (Lấy danh sách đơn hàng)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Order>>> GetOrders([FromQuery] int tenantId)
        {
            if (tenantId <= 0) return BadRequest("Missing TenantId");

            var orders = await _context.Orders
                .Include(o => o.Items)
                .Where(o => o.TenantId == tenantId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return Ok(orders);
        }

        // 2. POST: api/orders (Tạo đơn hàng mới + Gửi RabbitMQ)
        [HttpPost]
        public async Task<ActionResult<Order>> CreateOrder(Order order)
        {
            // Logic cũ: Kiểm tra Tenant
            if (order.TenantId <= 0) return BadRequest("Invalid TenantId");

            // Logic cũ: Set ngày giờ và trạng thái
            order.CreatedAt = DateTime.UtcNow;
            order.Status = "Pending";

            // 1. Lưu vào Database (Postgres)
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // 2. BẮN TIN NHẮN RABBITMQ (Đây là phần mới thêm)
            // Code này chạy song song, không làm chậm app
            await _publishEndpoint.Publish(new OrderCreatedEvent
            {
                OrderId = order.Id,
                TenantId = order.TenantId,
                TableId = order.TableId,
                TotalAmount = order.TotalAmount,
                CreatedAt = order.CreatedAt,
                Status = order.Status
            });

            // 3. Trả về kết quả cho Frontend ngay lập tức
            return CreatedAtAction(nameof(GetOrders), new { id = order.Id }, order);
        }

        // 3. PUT: api/orders/{id}/status (Cập nhật trạng thái)
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromQuery] string status, [FromQuery] int tenantId)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();

            // Bảo mật: Kiểm tra đúng quán
            if (order.TenantId != tenantId && tenantId > 0) return Unauthorized();

            order.Status = status;
            await _context.SaveChangesAsync();

            // (Tuỳ chọn) Sau này bạn có thể bắn thêm event OrderStatusChangedEvent ở đây
            // await _publishEndpoint.Publish(new OrderStatusChangedEvent { ... });

            return Ok(order);
        }
    }
}