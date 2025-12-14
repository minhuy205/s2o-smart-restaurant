using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TenantAuthService.Data;
using TenantAuthService.Models;
using TenantAuthService.DTOs;

namespace TenantAuthService.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        // --- 1. API ĐĂNG KÝ ---
        app.MapPost("/api/auth/register", async (AuthDbContext db, RegisterRequest request) =>
        {
            if (await db.Users.AnyAsync(u => u.Username == request.Username))
            {
                return Results.BadRequest(new { message = "Tài khoản đã tồn tại!" });
            }

            // A. Tạo Quán
            var newTenant = new Tenant
            {
                Name = request.RestaurantName,
                Address = request.Address,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Tenants.Add(newTenant);
            await db.SaveChangesAsync(); 

            // B. Tạo Owner
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            var newUser = new User
            {
                Username = request.Username,
                PasswordHash = passwordHash,
                FullName = request.FullName,
                PhoneNumber = request.PhoneNumber,
                Role = "Owner",
                TenantId = newTenant.Id,
                Points = 0,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(newUser);
            await db.SaveChangesAsync();

            return Results.Ok(new { message = "Đăng ký thành công!" });
        });

        // --- 2. API ĐĂNG NHẬP ---
        app.MapPost("/api/auth/login", async (AuthDbContext db, IConfiguration config, LoginRequest request) =>
        {
            Console.WriteLine($"[LOGIN] Checking user: {request.Username}");

            var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                Console.WriteLine("[LOGIN ERROR] Sai thông tin đăng nhập.");
                return Results.Unauthorized();
            }

            // Lấy tên quán ăn từ ID
            string tenantName = "Chưa cập nhật";
            if (user.TenantId != null)
            {
                var tenant = await db.Tenants.FindAsync(user.TenantId);
                tenantName = tenant?.Name ?? "Không xác định";
            }
            else if (user.Role == "Admin")
            {
                tenantName = "Hệ thống Quản trị S2O";
            }

            var token = GenerateJwtToken(user, config);

            // Trả về Full Data
            return Results.Ok(new AuthResponse 
            { 
                Token = token, 
                Username = user.Username, 
                Role = user.Role,
                FullName = user.FullName ?? user.Username,
                TenantId = user.TenantId,
                TenantName = tenantName
            });
        });
    }

    private static string GenerateJwtToken(User user, IConfiguration config)
    {
        var key = Encoding.ASCII.GetBytes(config["Jwt:Key"] ?? "SecretKeyRatDaiCanPhaiBaoMat123456");
        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("UserId", user.Id.ToString()),
                new Claim("TenantId", user.TenantId?.ToString() ?? "")
            }),
            Expires = DateTime.UtcNow.AddHours(2),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}