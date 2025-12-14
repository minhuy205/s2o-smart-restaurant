namespace TenantAuthService.DTOs;

public class RegisterRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
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
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    
    // CÁC TRƯỜNG MỚI ĐỂ HIỂN THỊ DASHBOARD
    public string FullName { get; set; } = string.Empty;
    public int? TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
}