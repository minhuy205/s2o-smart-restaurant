// File: Services/tenant-auth-service/Models/User.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TenantAuthService.Models; // <--- THÊM DÒNG NÀY

public class User
{
    [Key]
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string Role { get; set; } = "Customer";
    public string? PhoneNumber { get; set; }
    public int Points { get; set; } = 0;
    public int? TenantId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("TenantId")]
    public Tenant? Tenant { get; set; }
}