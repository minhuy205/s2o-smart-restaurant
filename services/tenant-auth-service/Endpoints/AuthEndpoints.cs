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
        // ==========================================
        // 1. API ĐĂNG KÝ (GIỮ NGUYÊN)
        // ==========================================
        app.MapPost("/api/auth/register", async (AuthDbContext db, RegisterRequest request) =>
        {
            if (await db.Users.AnyAsync(u => u.Username == request.Username))
            {
                return Results.BadRequest(new { success = false, message = "Tài khoản đã tồn tại!" });
            }

            int? newTenantId = null;

            // Logic cho Chủ Quán
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

            // Tạo User
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
        // 2. API ĐĂNG NHẬP (ĐÃ SỬA: PHỤC VỤ CẢ WEB VÀ MOBILE)
        // ==========================================
        app.MapPost("/api/auth/login", async (AuthDbContext db, IConfiguration config, LoginRequest request) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Results.BadRequest(new { success = false, message = "Sai tài khoản hoặc mật khẩu" });
            }

            // A. Lấy Tên Quán (Cho Web Admin hiển thị)
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

            // B. Lấy Danh sách Quán (Cho Mobile App hiển thị trang chủ)
            // LƯU Ý: Phải viết thường (id, name...) để khớp với React Native
            var tenantsList = await db.Tenants
                .Where(t => t.IsActive)
                .Select(t => new { 
                    id = t.Id,       // <-- Quan trọng: chữ thường
                    name = t.Name, 
                    address = t.Address, 
                    logoUrl = t.LogoUrl 
                })
                .ToListAsync();

            var token = GenerateJwtToken(user, config);

            // C. Trả về cục dữ liệu to (Gộp cả Web và Mobile)
            return Results.Ok(new 
            { 
                success = true,
                token = token,
                
                // Dữ liệu User cơ bản
                user = new {
                    id = user.Id,
                    username = user.Username,
                    fullName = user.FullName ?? user.Username,
                    role = user.Role,
                    tenantId = user.TenantId
                },

                // Dành cho Mobile App (cần list quán)
                tenants = tenantsList,

                // Dành cho Web Admin (cần thông tin phẳng ở ngoài)
                role = user.Role,
                tenantId = user.TenantId,
                tenantName = tenantName,
                username = user.Username,
                fullName = user.FullName ?? user.Username
            });
        });

        // ==========================================
        // 3. API GOOGLE SYNC (ĐÃ SỬA: CHỮ THƯỜNG CHO MOBILE)
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

                // Mobile cần danh sách này
                var tenants = await db.Tenants.Where(t => t.IsActive)
                    .Select(t => new { 
                        id = t.Id,        // <-- Quan trọng: chữ thường
                        name = t.Name, 
                        address = t.Address, 
                        logoUrl = t.LogoUrl 
                    }).ToListAsync();

                return Results.Ok(new {
                    success = true,
                    user = new { id = userId, email = request.Email, name = request.FullName, role = "Customer" },
                    tenants = tenants
                });
            }
            catch (Exception ex) { return Results.Problem(ex.Message); }
        });

        // ==========================================
        // 4. API ĐỔI MẬT KHẨU
        // ==========================================
        app.MapPost("/api/auth/change-password", async (AuthDbContext db, ChangePasswordRequest request) =>
        {
            try
            {
                var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
                
                if (user == null)
                {
                    return Results.BadRequest(new { success = false, message = "Người dùng không tồn tại" });
                }

                // Verify mật khẩu cũ
                if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                {
                    return Results.BadRequest(new { success = false, message = "Mật khẩu hiện tại không đúng" });
                }

                // Cập nhật mật khẩu mới
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                await db.SaveChangesAsync();

                return Results.Ok(new { success = true, message = "Đổi mật khẩu thành công" });
            }
            catch (Exception ex)
            {
                return Results.Problem($"Lỗi: {ex.Message}");
            }
        });

        // ==========================================
        // 5. API LẤY THÔNG TIN 1 QUÁN
        // ==========================================
        app.MapGet("/api/tenants/{id:int}", async (AuthDbContext db, int id) =>
        {
            var tenant = await db.Tenants.FindAsync(id);
            if (tenant == null) return Results.NotFound();
            // Trả về chữ thường cho Mobile dễ đọc
            return Results.Ok(new { id = tenant.Id, name = tenant.Name, address = tenant.Address, logoUrl = tenant.LogoUrl });
        });

        // ==========================================
        // 5. API ADMIN - DANH SÁCH NHÀ HÀNG (GIỮ NGUYÊN)
        // ==========================================
        app.MapGet("/api/admin/tenants", async (AuthDbContext db, HttpContext context, int? limit) =>
        {
            try 
            {
                if (!CheckAdminRole(context)) return Results.Json(new { message = "Forbidden" }, statusCode: 403);

                var query = from t in db.Tenants
                            join u in db.Users on t.Id equals u.TenantId into users
                            from owner in users.Where(u => u.Role == "Owner").DefaultIfEmpty()
                            orderby t.CreatedAt descending
                            select new 
                            {
                                id = t.Id, // Chữ thường cũng tốt cho Web JS
                                name = t.Name,
                                address = t.Address,
                                phoneNumber = owner != null ? owner.PhoneNumber : t.PhoneNumber,
                                email = t.Email,
                                logoUrl = t.LogoUrl,
                                ownerName = owner != null ? owner.FullName : t.OwnerName,
                                isActive = t.IsActive,
                                createdAt = t.CreatedAt,
                                updatedAt = t.UpdatedAt
                            };

                var tenants = limit.HasValue && limit.Value > 0 ? await query.Take(limit.Value).ToListAsync() : await query.ToListAsync();
                return Results.Ok(tenants);
            }
            catch (Exception ex) { return Results.Problem($"Lỗi: {ex.Message}"); }
        });

        // ==========================================
        // 6. API ADMIN - DANH SÁCH KHÁCH HÀNG (GIỮ NGUYÊN)
        // ==========================================
        app.MapGet("/api/admin/customers", async (AuthDbContext db, HttpContext context, int? limit) =>
        {
            try 
            {
                if (!CheckAdminRole(context)) return Results.Json(new { message = "Forbidden" }, statusCode: 403);

                var query = db.Users.Where(u => u.Role != "Admin").OrderByDescending(u => u.CreatedAt)
                    .Select(u => new 
                    {
                        id = u.Id,
                        username = u.Username,
                        fullName = u.FullName ?? u.Username,
                        phoneNumber = u.PhoneNumber,
                        points = u.Points,
                        role = u.Role,
                        createdAt = u.CreatedAt
                    });

                var customers = limit.HasValue && limit.Value > 0 ? await query.Take(limit.Value).ToListAsync() : await query.ToListAsync();
                return Results.Ok(customers);
            }
            catch (Exception ex) { return Results.Problem($"Lỗi: {ex.Message}"); }
        });

        // ==========================================
        // 7. API ADMIN - THÊM NHÀ HÀNG MỚI
        // ==========================================
        app.MapPost("/api/admin/tenants", async (AuthDbContext db, HttpContext context, UpdateTenantRequest request) =>
        {
            try 
            {
                if (!CheckAdminRole(context)) return Results.Json(new { message = "Forbidden" }, statusCode: 403);

                var newTenant = new Tenant
                {
                    Name = request.Name ?? "Nhà hàng mới",
                    Address = request.Address ?? "",
                    PhoneNumber = request.PhoneNumber ?? "",
                    Email = request.Email ?? "",
                    OwnerName = request.OwnerName ?? "",
                    LogoUrl = request.LogoUrl,
                    IsActive = request.IsActive ?? true,
                    CreatedAt = DateTime.UtcNow
                };

                db.Tenants.Add(newTenant);
                await db.SaveChangesAsync();

                return Results.Ok(new { success = true, message = "Thêm nhà hàng thành công", id = newTenant.Id });
            }
            catch (Exception ex) { return Results.Problem($"Lỗi: {ex.Message}"); }
        });

        // ==========================================
        // 8. API ADMIN - CẬP NHẬT NHÀ HÀNG
        // ==========================================
        app.MapPut("/api/admin/tenants/{id:int}", async (AuthDbContext db, HttpContext context, int id, UpdateTenantRequest request) =>
        {
            try 
            {
                if (!CheckAdminRole(context)) return Results.Json(new { message = "Forbidden" }, statusCode: 403);

                var tenant = await db.Tenants.FindAsync(id);
                if (tenant == null) return Results.NotFound(new { success = false, message = "Nhà hàng không tồn tại" });

                // Cập nhật các field
                if (!string.IsNullOrEmpty(request.Name)) tenant.Name = request.Name;
                if (!string.IsNullOrEmpty(request.Address)) tenant.Address = request.Address;
                if (!string.IsNullOrEmpty(request.PhoneNumber)) tenant.PhoneNumber = request.PhoneNumber;
                if (!string.IsNullOrEmpty(request.Email)) tenant.Email = request.Email;
                if (!string.IsNullOrEmpty(request.OwnerName)) tenant.OwnerName = request.OwnerName;
                if (!string.IsNullOrEmpty(request.LogoUrl)) tenant.LogoUrl = request.LogoUrl;
                if (request.IsActive.HasValue) tenant.IsActive = request.IsActive.Value;
                tenant.UpdatedAt = DateTime.UtcNow;

                await db.SaveChangesAsync();

                return Results.Ok(new { success = true, message = "Cập nhật nhà hàng thành công" });
            }
            catch (Exception ex) { return Results.Problem($"Lỗi: {ex.Message}"); }
        });

        // ==========================================
        // 9. API ADMIN - XÓA NHÀ HÀNG
        // ==========================================
        app.MapDelete("/api/admin/tenants/{id:int}", async (AuthDbContext db, HttpContext context, int id) =>
        {
            try 
            {
                if (!CheckAdminRole(context)) return Results.Json(new { message = "Forbidden" }, statusCode: 403);

                var tenant = await db.Tenants.FindAsync(id);
                if (tenant == null) return Results.NotFound(new { success = false, message = "Nhà hàng không tồn tại" });

                // Xóa (hoặc gỡ liên kết) các user thuộc tenant để tránh lỗi FK
                var users = await db.Users.Where(u => u.TenantId == id).ToListAsync();
                if (users.Count > 0)
                {
                    db.Users.RemoveRange(users);
                }

                db.Tenants.Remove(tenant);
                await db.SaveChangesAsync();

                return Results.Ok(new { success = true, message = "Xóa nhà hàng thành công" });
            }
            catch (Exception ex) { return Results.Problem($"Lỗi: {ex.Message}"); }
        });

        // ==========================================
        // 10. API ADMIN - THỐNG KÊ TỔNG QUAN
        // ==========================================
        app.MapGet("/api/admin/statistics", async (AuthDbContext db, HttpContext context) =>
        {
            try 
            {
                if (!CheckAdminRole(context)) return Results.Json(new { message = "Forbidden" }, statusCode: 403);

                var totalRestaurants = await db.Tenants.CountAsync();
                var activeRestaurants = await db.Tenants.CountAsync(t => t.IsActive);
                var totalUsers = await db.Users.CountAsync(u => u.Role != "Admin");
                var totalCustomers = await db.Users.CountAsync(u => u.Role == "Customer");
                var totalOwners = await db.Users.CountAsync(u => u.Role == "Owner");

                // Thống kê nhà hàng mới trong tháng
                var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                var restaurantsThisMonth = await db.Tenants.CountAsync(t => t.CreatedAt >= startOfMonth);

                // Thống kê người dùng mới trong tháng
                var usersThisMonth = await db.Users.CountAsync(u => u.CreatedAt >= startOfMonth && u.Role != "Admin");

                return Results.Ok(new 
                {
                    totalRestaurants = totalRestaurants,
                    activeRestaurants = activeRestaurants,
                    totalUsers = totalUsers,
                    totalCustomers = totalCustomers,
                    totalOwners = totalOwners,
                    restaurantsThisMonth = restaurantsThisMonth,
                    usersThisMonth = usersThisMonth,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex) { return Results.Problem($"Lỗi: {ex.Message}"); }
        });
        // ==========================================
// API LẤY THÔNG TIN ĐIỂM THƯỞNG CỦA USER
// ==========================================
app.MapGet("/api/membership/points/{userId:int}", async (AuthDbContext db, int userId) =>
{
    var user = await db.Users.FindAsync(userId);
    if (user == null) return Results.NotFound(new { message = "Không tìm thấy người dùng" });

    return Results.Ok(new { 
        userId = user.Id, 
        fullName = user.FullName, 
        points = user.Points, 
        role = user.Role 
    });
});
// Lấy danh sách khách hàng (Có thể lọc thêm theo TenantId nếu bạn gán khách vào quán khi đặt đơn)
app.MapGet("/api/membership/tenant/{tenantId:int}", async (AuthDbContext db, int tenantId) =>
{
    var members = await db.Users
        .Where(u => u.Role == "Customer") // Lấy tất cả khách hàng trong hệ thống S2O
        .Select(u => new {
            id = u.Id,
            username = u.Username,
            fullName = u.FullName,
            phoneNumber = u.PhoneNumber,
            points = u.Points,
            createdAt = u.CreatedAt
        })
        .ToListAsync();

    return Results.Ok(members);
});

// ==========================================
// API CẬP NHẬT ĐIỂM THƯỞNG (Đã sửa để nhận DTO)
// ==========================================
app.MapPost("/api/membership/add-points", async (AuthDbContext db, AddPointsRequest request) =>
{
    // Tìm user dựa trên ID truyền vào từ request body
    var user = await db.Users.FindAsync(request.UserId);
    if (user == null) return Results.NotFound(new { message = "Không tìm thấy người dùng" });

    // Thực hiện cộng điểm
    user.Points += request.PointsToAdd;
    await db.SaveChangesAsync();

    return Results.Ok(new { 
        success = true, 
        message = $"Đã cộng {request.PointsToAdd} điểm. Tổng điểm hiện tại: {user.Points}",
        currentPoints = user.Points
    });
});

    }

    // --- HÀM HỖ TRỢ ---
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

public class GoogleAuthRequest
{
    public string Email { get; set; }
    public string FullName { get; set; }
    public string GoogleId { get; set; }
    public string PhotoUrl { get; set; }
}
public class AddPointsRequest 
{
    public int UserId { get; set; }
    public int PointsToAdd { get; set; }
}