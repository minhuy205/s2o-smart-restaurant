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
// }using BCrypt.Net;
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
        // ==========================================
        // 1. API ĐĂNG KÝ
        // ==========================================
        app.MapPost("/api/auth/register", async (AuthDbContext db, RegisterRequest request) =>
        {
            if (await db.Users.AnyAsync(u => u.Username == request.Username))
            {
                return Results.BadRequest(new { success = false, message = "Tài khoản đã tồn tại!" });
            }

            int? newTenantId = null;

            if (request.Role == "Owner")
            {
                if (string.IsNullOrEmpty(request.RestaurantName))
                    return Results.BadRequest(new { success = false, message = "Thiếu tên quán" });

                var newTenant = new Tenant
                {
                    Name = request.RestaurantName,
                    Address = request.Address,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                db.Tenants.Add(newTenant);
                await db.SaveChangesAsync();
                newTenantId = newTenant.Id;
            }

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            var newUser = new User
            {
                Username = request.Username,
                PasswordHash = passwordHash,
                FullName = request.FullName,
                PhoneNumber = request.PhoneNumber,
                Role = request.Role ?? "Customer",
                TenantId = newTenantId,
                Points = 0,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(newUser);
            await db.SaveChangesAsync();

            return Results.Ok(new { success = true, message = "Đăng ký thành công!" });
        });

        // ==========================================
        // 2. API ĐĂNG NHẬP (ĐÃ SỬA LỖI TRÙNG BIẾN CS0128)
        // ==========================================
        app.MapPost("/api/auth/login", async (AuthDbContext db, IConfiguration config, LoginRequest request) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Results.BadRequest(new { success = false, message = "Sai tài khoản hoặc mật khẩu" });
            }

            // A. Xác định hạng thành viên
            string membership = user.Points switch
            {
                >= 5000 => "Diamond",
                >= 2000 => "Gold",
                >= 500 => "Silver",
                _ => "Iron"
            };

            // B. Lấy Tên Quán (Cho Web Admin)
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

            // C. Lấy Danh sách Quán (Cho Mobile App)
            var tenantsList = await db.Tenants
                .Where(t => t.IsActive)
                .Select(t => new { 
                    id = t.Id,
                    name = t.Name, 
                    address = t.Address, 
                    logoUrl = t.LogoUrl 
                })
                .ToListAsync();

            // D. Tạo Token
            var token = GenerateJwtToken(user, config);

            // E. Trả về dữ liệu tổng hợp
            return Results.Ok(new 
            { 
                success = true,
                token = token,
                user = new {
                    id = user.Id,
                    username = user.Username,
                    fullName = user.FullName ?? user.Username,
                    role = user.Role,
                    tenantId = user.TenantId,
                    points = user.Points,
                    membership = membership
                },
                tenants = tenantsList,
                tenantName = tenantName, // Dùng cho Web
                role = user.Role         // Dùng cho Web
            });
        });

        // ==========================================
        // 3. API GOOGLE SYNC
        // ==========================================
        app.MapPost("/api/auth/google-sync", async (AuthDbContext db, GoogleAuthRequest request) =>
        {
            try 
            {
                var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Email);
                int userId;

                if (user != null) userId = user.Id;
                else
                {
                    var newUser = new User { Username = request.Email, PasswordHash = "google_auth", FullName = request.FullName, Role = "Customer", CreatedAt = DateTime.UtcNow };
                    db.Users.Add(newUser);
                    await db.SaveChangesAsync();
                    userId = newUser.Id;
                }

                var tenants = await db.Tenants.Where(t => t.IsActive)
                    .Select(t => new { id = t.Id, name = t.Name, address = t.Address, logoUrl = t.LogoUrl })
                    .ToListAsync();

                return Results.Ok(new {
                    success = true,
                    user = new { id = userId, email = request.Email, name = request.FullName, role = "Customer" },
                    tenants = tenants
                });
            }
            catch (Exception ex) { return Results.Problem(ex.Message); }
        });

        // ==========================================
        // 4. API TÌM KIẾM NHÀ HÀNG
        // ==========================================
        app.MapGet("/api/tenants/search", async (AuthDbContext db, string query) =>
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return Results.BadRequest(new { success = false, message = "Từ khóa tìm kiếm không được để trống" });
            }

            var normalizedQuery = query.ToLower();
            var results = await db.Tenants
                .Where(t => t.IsActive && (t.Name.ToLower().Contains(normalizedQuery) || t.Address.ToLower().Contains(normalizedQuery)))
                .Select(t => new { id = t.Id, name = t.Name, address = t.Address, logoUrl = t.LogoUrl })
                .ToListAsync();

            return Results.Ok(results);
        });

        // Các API Admin khác giữ nguyên (statistics, tenants management...)
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

    private static bool CheckAdminRole(HttpContext context)
    {
        var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
        if (string.IsNullOrEmpty(token)) return false;
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);
        var role = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value ?? jwtToken.Claims.FirstOrDefault(c => c.Type == "role")?.Value;
        return role == "Admin";
    }
}