using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace OrderPaymentService.Models
{
    public class Order
    {
        public int Id { get; set; }

        // --- QUAN TRỌNG: TableId để mapping với bàn ăn ---
        public int TableId { get; set; }
        public string TableName { get; set; } = string.Empty;
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }
        
        public string Status { get; set; } = "Pending";
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Phân biệt đơn của nhà hàng nào
        public int TenantId { get; set; }

        // --- FIX: DeviceToken phải nằm ở đây (Cấp độ Đơn hàng) ---
        // Để lưu token của máy khách đặt đơn, phục vụ bắn thông báo Firebase
        public string? DeviceToken { get; set; } 

        public List<OrderItem> Items { get; set; } = new();
    }

    public class OrderItem
    {
        public int Id { get; set; }
        public string MenuItemName { get; set; } = string.Empty;
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }
        
        public int Quantity { get; set; }
        public string Note { get; set; } = string.Empty;

        public int OrderId { get; set; }
        
        [JsonIgnore]
        public Order? Order { get; set; }
    }
}