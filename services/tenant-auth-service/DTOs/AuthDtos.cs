namespace TenantAuthService.DTOs;

public class RegisterRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty; // Tên chủ sở hữu
    public string PhoneNumber { get; set; } = string.Empty;
    public string RestaurantName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Role { get; set; } = "Owner";
}

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    // 👇 QUAN TRỌNG: Thêm ID để App biết user nào đang đăng nhập
    public int Id { get; set; } 
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public int? TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
}

public class TenantResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? OwnerName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class UpdateTenantRequest
{
    public string? Name { get; set; }
    public string? Address { get; set; }
    public string? OwnerName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? LogoUrl { get; set; }
    public bool? IsActive { get; set; }
}

// 👇 Dùng cho cập nhật Profile trên Mobile App
public class UpdateProfileRequest
{
    public string FullName { get; set; }
    public string PhoneNumber { get; set; }
}

// 👇 Dùng cho đăng nhập Google trên Mobile App
public class GoogleAuthRequest
{
    public string Email { get; set; }
    public string FullName { get; set; }
    public string GoogleId { get; set; }
    public string PhotoUrl { get; set; }
}

// 👇 Dùng cho đổi mật khẩu
public class ChangePasswordRequest
{
    public string Username { get; set; } = string.Empty;
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}