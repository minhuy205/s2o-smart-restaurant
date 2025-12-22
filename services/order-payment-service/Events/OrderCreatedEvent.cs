using System;
using System.Collections.Generic;

namespace OrderPaymentService.Events
{
    // Class này chứa thông tin đơn hàng sẽ gửi đi
    public class OrderCreatedEvent
    {
        public int OrderId { get; set; }
        public int TenantId { get; set; }
        public int TableId { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Status { get; set; }
        
        // Bạn có thể thêm List món ăn vào đây nếu cần hiển thị chi tiết bên Bếp
        // public List<OrderItemDto> Items { get; set; } 
    }
}