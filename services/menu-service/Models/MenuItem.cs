namespace MenuService.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class MenuItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int CategoryId { get; set; }
    public bool IsAvailable { get; set; } = true;
}