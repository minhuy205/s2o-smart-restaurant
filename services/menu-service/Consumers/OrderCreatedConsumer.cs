using MassTransit;
using OrderPaymentService.Events; 
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using MenuService.Data; // [Cần thêm] Namespace chứa AppDbContext
using Microsoft.EntityFrameworkCore; // [Cần thêm] Để dùng các hàm async của DB

namespace MenuService.Consumers
{
    public class OrderCreatedConsumer : IConsumer<OrderCreatedEvent>
    {
        private readonly ILogger<OrderCreatedConsumer> _logger;
        private readonly AppDbContext _db; // [Thêm] Khai báo DbContext

        // [Sửa] Inject thêm AppDbContext vào constructor
        public OrderCreatedConsumer(ILogger<OrderCreatedConsumer> logger, AppDbContext db)
        {
            _logger = logger;
            _db = db;
        }

        public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
        {
            var order = context.Message;
            
            _logger.LogInformation("==========================================");
            _logger.LogInformation($"[BẾP - NHẬN ĐƠN MỚI] OrderID: {order.OrderId} | Bàn: {order.TableId}");

            // --- LOGIC CẬP NHẬT TRẠNG THÁI BÀN [BẮT ĐẦU] ---
            
            // 1. Tìm bàn tương ứng trong CSDL
            var table = await _db.Tables.FirstOrDefaultAsync(t => t.Id == order.TableId);

            if (table != null)
            {
                // 2. Cập nhật trạng thái thành "Occupied" (Có khách)
                table.Status = "Occupied";
                
                // 3. Gán OrderId hiện tại vào bàn để biết bàn đang ăn đơn nào
                table.CurrentOrderId = order.OrderId;

                // 4. Lưu thay đổi xuống Database
                await _db.SaveChangesAsync();

                _logger.LogInformation($"-> Đã cập nhật Bàn {table.Id} ({table.Name}): Trạng thái = Occupied, CurrentOrder = {order.OrderId}");
            }
            else
            {
                _logger.LogWarning($"-> CẢNH BÁO: Không tìm thấy bàn có ID {order.TableId} trong hệ thống MenuService!");
            }
            // --- LOGIC CẬP NHẬT TRẠNG THÁI BÀN [KẾT THÚC] ---

            _logger.LogInformation($"Tổng tiền: {order.TotalAmount}");
            _logger.LogInformation("==========================================");
            
            await Task.CompletedTask;
        }
    }
}