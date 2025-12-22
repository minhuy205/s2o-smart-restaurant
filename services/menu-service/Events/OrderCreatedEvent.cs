using System;

// QUAN TRỌNG: Namespace phải giống hệt bên gửi (OrderPaymentService)
namespace OrderPaymentService.Events
{
    public class OrderCreatedEvent
    {
        public int OrderId { get; set; }
        public int TenantId { get; set; }
        public int TableId { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Status { get; set; }
    }
}