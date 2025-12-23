using System;
using System.Collections.Generic;

namespace OrderPaymentService.Events
{
    // Class này chứa thông tin đơn hàng sẽ gửi đi qua RabbitMQ
    public class OrderCreatedEvent
    {
        public int OrderId { get; set; }
        public int TenantId { get; set; }
        public int TableId { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Status { get; set; }
        
        // Có thể mở rộng thêm Items sau này nếu Service khác cần biết chi tiết món
        // public List<object> Items { get; set; } 
    }
}