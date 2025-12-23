// using Microsoft.EntityFrameworkCore;
// using OrderPaymentService.Data;
// using OrderPaymentService.Models;

// var builder = WebApplication.CreateBuilder(args);

// // Kết nối Database
// var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
//     ?? "Host=postgres;Port=5432;Database=order_db;Username=s2o;Password=h9minhhuy";

// builder.Services.AddDbContext<AppDbContext>(options =>
//     options.UseNpgsql(connectionString));

// builder.Services.AddCors(options =>
// {
//     options.AddPolicy("AllowAll",
//         policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
// });

// var app = builder.Build();
// app.UseCors("AllowAll");

// // --- CÁC API ---

// // 1. Lấy tất cả đơn hàng (LỌC THEO TENANT)
// // Gọi: GET /api/orders?tenantId=1
// app.MapGet("/api/orders", async (int tenantId, AppDbContext db) =>
// {
//     if (tenantId <= 0) return Results.BadRequest("Missing TenantId");

//     var orders = await db.Orders
//         .Include(o => o.Items)
//         .Where(o => o.TenantId == tenantId) // Chỉ lấy đơn của quán này
//         .OrderByDescending(o => o.CreatedAt)
//         .ToListAsync();
        
//     return Results.Ok(orders);
// });

// // 2. Tạo đơn hàng mới (NHẬN TENANT ID TỪ FE)
// app.MapPost("/api/orders", async (Order order, AppDbContext db) =>
// {
//     if (order.TenantId <= 0) return Results.BadRequest("Invalid TenantId");

//     order.CreatedAt = DateTime.UtcNow;
//     order.Status = "Pending";
    
//     db.Orders.Add(order);
//     await db.SaveChangesAsync();
//     return Results.Created($"/api/orders/{order.Id}", order);
// });

// // 3. Cập nhật trạng thái
// // Gọi: PUT /api/orders/{id}/status?status=...&tenantId=...
// app.MapPut("/api/orders/{id}/status", async (int id, string status, int tenantId, AppDbContext db) =>
// {
//     var order = await db.Orders.FindAsync(id);
//     if (order is null) return Results.NotFound();

//     // Bảo mật: Kiểm tra đơn này có đúng của quán đang đăng nhập không
//     if (order.TenantId != tenantId && tenantId > 0) return Results.Unauthorized();

//     order.Status = status;
//     await db.SaveChangesAsync();
//     return Results.Ok(order);
// });

// app.MapGet("/", () => "Order Service is Running!");

// app.Run();
using OrderPaymentService.Data;
using Microsoft.EntityFrameworkCore;
using MassTransit; 
using OrderPaymentService.Services;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. CẤU HÌNH DATABASE (PostgreSQL)
// ==========================================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=postgres;Port=5432;Database=order_db;Username=s2o;Password=h9minhhuy";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// ==========================================
// 2. CẤU HÌNH RABBITMQ (MASSTRANSIT)
// ==========================================
builder.Services.AddMassTransit(x =>
{
    // Cấu hình kết nối tới RabbitMQ
    x.UsingRabbitMq((context, cfg) =>
    {
        // "rabbitmq" là tên service trong docker-compose.yml
        cfg.Host("rabbitmq", "/", h => {
            h.Username("guest");
            h.Password("guest");
        });
    });
});

// ==========================================
// 3. CẤU HÌNH SERVICES & CONTROLLERS
// ==========================================

// Đăng ký Service gửi thông báo Firebase
builder.Services.AddSingleton<NotificationService>();

// Chuyển sang dùng Controller
builder.Services.AddControllers(); 
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Cấu hình CORS (Cho phép Frontend gọi API)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

// ==========================================
// 4. PIPELINE (LUỒNG XỬ LÝ)
// ==========================================

// Bật Swagger ở mọi môi trường để dễ test
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAll");

app.UseAuthorization();

// Tự động map các Controller (bao gồm OrderController)
app.MapControllers(); 

// Tự động chạy Migration (Tạo bảng DB nếu chưa có)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try 
    {
        var db = services.GetRequiredService<AppDbContext>();
        db.Database.Migrate();
        Console.WriteLine("--> Database Migration Applied Successfully.");
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "--> Lỗi khi thực hiện Migration Database.");
    }
}

app.Run();