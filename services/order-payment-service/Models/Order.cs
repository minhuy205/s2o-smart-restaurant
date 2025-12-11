using System.Text.Json.Serialization;

namespace OrderPaymentService.Models;

public class Order
{
    public int Id { get; set; }
    public string TableName { get; set; } = string.Empty; // Ví dụ: "Bàn 5"
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Cooking, Completed, Paid
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<OrderItem> Items { get; set; } = new();
}

public class OrderItem
{
    public int Id { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    
    // Khoá ngoại trỏ về Order
    public int OrderId { get; set; }
    [JsonIgnore] // Tránh vòng lặp khi chuyển sang JSON
    public Order? Order { get; set; }
}