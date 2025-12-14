using Microsoft.EntityFrameworkCore;
using TenantAuthService.Data;
using TenantAuthService.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=postgres;Port=5432;Database=auth_db;Username=s2o;Password=h9minhhuy";

builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Cấu hình CORS (QUAN TRỌNG ĐỂ FIX LỖI FRONTEND)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy
            .AllowAnyOrigin()   // Chấp nhận mọi nguồn (localhost:3001)
            .AllowAnyMethod()
            .AllowAnyHeader());
});

// 3. Thêm dịch vụ Authentication & Authorization (Cần thiết vì bạn đã cài JwtBearer)
builder.Services.AddAuthentication().AddJwtBearer();
builder.Services.AddAuthorization();

var app = builder.Build();

// --- MIDDLEWARE PIPELINE ---

// 4. Kích hoạt CORS (Phải đặt đầu tiên)
app.UseCors("AllowAll");

// 5. Kích hoạt Auth (Đặt sau CORS)
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "Tenant Auth Service is Running...");

// 6. Tự động tạo DB (Migration)
using (var scope = app.Services.CreateScope())
{
    try 
    {
        var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        db.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Lỗi tạo DB: {ex.Message}");
    }
}

// 7. Map API Endpoints (CHỈ GỌI 1 LẦN Ở ĐÂY)
app.MapAuthEndpoints();

app.Run();