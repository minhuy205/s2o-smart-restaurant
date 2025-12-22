using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations.Schema;

namespace OrderPaymentService.Models
{
    public class Order
    {
        public int Id { get; set; }

        // --- QUAN TRỌNG: Cần thêm TableId để Controller không bị lỗi ---
        public int TableId { get; set; }
        // ----------------------------------------------------------------

        public string TableName { get; set; } = string.Empty;
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }
        
        public string Status { get; set; } = "Pending";
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Phân biệt đơn của nhà hàng nào
        public int TenantId { get; set; }

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