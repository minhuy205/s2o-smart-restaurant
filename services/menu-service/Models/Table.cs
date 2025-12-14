namespace MenuService.Models;

public class Table
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = "Available"; // Available, Occupied
    public int? CurrentOrderId { get; set; } // Null nếu bàn trống
    public int TenantId { get; set; }
}