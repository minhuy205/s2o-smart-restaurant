using MassTransit;
using OrderPaymentService.Events; // Sử dụng class Event vừa tạo
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace MenuService.Consumers
{
    public class OrderCreatedConsumer : IConsumer<OrderCreatedEvent>
    {
        private readonly ILogger<OrderCreatedConsumer> _logger;

        public OrderCreatedConsumer(ILogger<OrderCreatedConsumer> logger)
        {
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
        {
            var order = context.Message;
            
            // In ra Console để kiểm chứng là đã nhận được
            _logger.LogInformation("==========================================");
            _logger.LogInformation($"[BẾP - NHẬN ĐƠN MỚI] OrderID: {order.OrderId} | Bàn: {order.TableId}");
            _logger.LogInformation($"Tổng tiền: {order.TotalAmount}");
            _logger.LogInformation("==========================================");

            // TODO: Tại đây bạn có thể thêm logic lưu vào DB Bếp hoặc bắn SignalR
            
            await Task.CompletedTask;
        }
    }
}