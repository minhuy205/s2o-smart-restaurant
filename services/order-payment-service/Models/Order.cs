using System.Text.Json.Serialization;

namespace OrderPaymentService.Models;

public class Order
{
    public int Id { get; set; }
    public string TableName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Thêm dòng này để phân biệt đơn của nhà hàng nào
    public int TenantId { get; set; }

    public List<OrderItem> Items { get; set; } = new();
}

public class OrderItem
{
    // ... (Giữ nguyên các trường cũ: Id, MenuItemName, Price, Quantity, Note...)
    public int Id { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public string Note { get; set; }

    public int OrderId { get; set; }
    [JsonIgnore]
    public Order? Order { get; set; }
}