// using BCrypt.Net;
// using Microsoft.EntityFrameworkCore;
// using Microsoft.IdentityModel.Tokens;
// using System.IdentityModel.Tokens.Jwt;
// using System.Security.Claims;
// using System.Text;
// using TenantAuthService.Data;
// using TenantAuthService.Models;
// using TenantAuthService.DTOs;

// namespace TenantAuthService.Endpoints;

// public static class AuthEndpoints
// {
//     public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
//     {
//         // --- 1. API ĐĂNG KÝ ---
//         app.MapPost("/api/auth/register", async (AuthDbContext db, RegisterRequest request) =>
//         {
//             if (await db.Users.AnyAsync(u => u.Username == request.Username))
//             {
//                 return Results.BadRequest(new { message = "Tài khoản đã tồn tại!" });
//             }

//             // A. Tạo Quán
//             var newTenant = new Tenant
//             {
//                 Name = request.RestaurantName,
//                 Address = request.Address,
//                 IsActive = true,
//                 CreatedAt = DateTime.UtcNow
//             };
//             db.Tenants.Add(newTenant);
//             await db.SaveChangesAsync(); 

//             // B. Tạo Owner
//             string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
//             var newUser = new User
//             {
//                 Username = request.Username,
//                 PasswordHash = passwordHash,
//                 FullName = request.FullName,
//                 PhoneNumber = request.PhoneNumber,
//                 Role = "Owner",
//                 TenantId = newTenant.Id,
//                 Points = 0,
//                 CreatedAt = DateTime.UtcNow
//             };
//             db.Users.Add(newUser);
//             await db.SaveChangesAsync();

//             return Results.Ok(new { message = "Đăng ký thành công!" });
//         });

//         // --- 2. API ĐĂNG NHẬP ---
//         app.MapPost("/api/auth/login", async (AuthDbContext db, IConfiguration config, LoginRequest request) =>
//         {
//             Console.WriteLine($"[LOGIN] Checking user: {request.Username}");

//             var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            
//             if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
//             {
//                 Console.WriteLine("[LOGIN ERROR] Sai thông tin đăng nhập.");
//                 return Results.Unauthorized();
//             }

//             // Lấy tên quán ăn từ ID
//             string tenantName = "Chưa cập nhật";
//             if (user.TenantId != null)
//             {
//                 var tenant = await db.Tenants.FindAsync(user.TenantId);
//                 tenantName = tenant?.Name ?? "Không xác định";
//             }
//             else if (user.Role == "Admin")
//             {
//                 tenantName = "Hệ thống Quản trị S2O";
//             }

//             var token = GenerateJwtToken(user, config);

//             // Trả về Full Data
//             return Results.Ok(new AuthResponse 
//             { 
//                 Token = token, 
//                 Username = user.Username, 
//                 Role = user.Role,
//                 FullName = user.FullName ?? user.Username,
//                 TenantId = user.TenantId,
//                 TenantName = tenantName
//             });
//         });

//         // --- 3. Lấy thông tin Tenant theo ID ---
//         app.MapGet("/api/tenants/{id:int}", async (AuthDbContext db, int id) =>
//         {
//             var tenant = await db.Tenants.FindAsync(id);
//             if (tenant == null) return Results.NotFound();
//             return Results.Ok(new { id = tenant.Id, name = tenant.Name, address = tenant.Address, logoUrl = tenant.LogoUrl });
//         });
//     }

//     private static string GenerateJwtToken(User user, IConfiguration config)
//     {
//         var key = Encoding.ASCII.GetBytes(config["Jwt:Key"] ?? "SecretKeyRatDaiCanPhaiBaoMat123456");
//         var tokenHandler = new JwtSecurityTokenHandler();
//         var tokenDescriptor = new SecurityTokenDescriptor
//         {
//             Subject = new ClaimsIdentity(new[]
//             {
//                 new Claim(ClaimTypes.Name, user.Username),
//                 new Claim(ClaimTypes.Role, user.Role),
//                 new Claim("UserId", user.Id.ToString()),
//                 new Claim("TenantId", user.TenantId?.ToString() ?? "")
//             }),
//             Expires = DateTime.UtcNow.AddHours(2),
//             SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
//         };
//         var token = tokenHandler.CreateToken(tokenDescriptor);
//         return tokenHandler.WriteToken(token);
//     }
// }

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
        // --- 1. API ĐĂNG KÝ (Cho chủ quán) ---
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

        // --- 2. API ĐĂNG NHẬP (Web Quản lý) ---
        app.MapPost("/api/auth/login", async (AuthDbContext db, IConfiguration config, LoginRequest request) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Results.Unauthorized();
            }

            string tenantName = "Chưa cập nhật";
            if (user.TenantId != null)
            {
                var tenant = await db.Tenants.FindAsync(user.TenantId);
                tenantName = tenant?.Name ?? "Không xác định";
            }

            var token = GenerateJwtToken(user, config);

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

        // --- 3. API GOOGLE SYNC (Cho Mobile App) --- 
        // 👇 ĐÂY LÀ ĐOẠN QUAN TRỌNG BẠN ĐANG THIẾU
        app.MapPost("/api/auth/google-sync", async (AuthDbContext db, GoogleAuthRequest request) =>
        {
            try 
            {
                // A. Kiểm tra User đã có chưa?
                var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Email);
                int userId;

                if (user != null)
                {
                    userId = user.Id;
                }
                else
                {
                    // Chưa có -> Tạo mới (Role Customer)
                    var newUser = new User
                    {
                        Username = request.Email,
                        PasswordHash = "google_auth",
                        FullName = request.FullName,
                        Role = "Customer",
                        CreatedAt = DateTime.UtcNow,
                        Points = 0
                    };
                    db.Users.Add(newUser);
                    await db.SaveChangesAsync();
                    userId = newUser.Id;
                }

                // B. Lấy danh sách Nhà hàng (để hiện trang chủ App)
                var tenants = await db.Tenants
                    .Where(t => t.IsActive)
                    .Select(t => new { 
                        Id = t.Id, 
                        Name = t.Name, 
                        Address = t.Address, 
                        LogoUrl = t.LogoUrl 
                    })
                    .ToListAsync();

                // C. Trả về đúng định dạng App cần
                return Results.Ok(new 
                {
                    success = true,
                    user = new { id = userId, email = request.Email, name = request.FullName, role = "Customer" },
                    tenants = tenants
                });
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        });

        // --- 4. API LẤY THÔNG TIN QUÁN ---
        app.MapGet("/api/tenants/{id:int}", async (AuthDbContext db, int id) =>
        {
            var tenant = await db.Tenants.FindAsync(id);
            if (tenant == null) return Results.NotFound();
            return Results.Ok(new { id = tenant.Id, name = tenant.Name, address = tenant.Address, logoUrl = tenant.LogoUrl });
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

// 👇 Thêm class này ở cuối file nếu bạn chưa có trong thư mục DTOs
public class GoogleAuthRequest
{
    public string Email { get; set; }
    public string FullName { get; set; }
    public string GoogleId { get; set; }
    public string PhotoUrl { get; set; }
}