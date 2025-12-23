namespace TenantAuthService.Models;

public class Tenant
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // Tên quán
    public string? Address { get; set; } // Địa chỉ kinh doanh
    public string? OwnerName { get; set; } // Họ và tên chủ sở hữu
    public string? PhoneNumber { get; set; } // Số điện thoại
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
}
