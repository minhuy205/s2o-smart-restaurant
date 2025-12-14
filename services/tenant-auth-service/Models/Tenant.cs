namespace TenantAuthService.Models;

public class Tenant
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // Tên quán
    public string? Address { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}