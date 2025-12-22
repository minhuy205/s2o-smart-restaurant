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
using MassTransit; // <-- Thêm thư viện này

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. CẤU HÌNH DATABASE
// ==========================================
// Giữ lại logic fallback connection string cũ của bạn để đảm bảo không lỗi kết nối
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
// Chuyển sang dùng Controller thay vì Minimal API
builder.Services.AddControllers(); 
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Giữ lại cấu hình CORS cho Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

// ==========================================
// 4. PIPELINE (LUỒNG XỬ LÝ)
// ==========================================

// Swagger

    app.UseSwagger();
    app.UseSwaggerUI();


app.UseCors("AllowAll");

// Tự động chạy Migration (Tạo bảng nếu chưa có)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try 
    {
        var db = services.GetRequiredService<AppDbContext>();
        db.Database.Migrate();
    }
    catch (Exception ex)
    {
        // Log lỗi nếu không kết nối được DB lúc khởi động
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Lỗi khi thực hiện Migration Database.");
    }
}

app.UseAuthorization();

// QUAN TRỌNG: Lệnh này sẽ tự động tìm và kích hoạt OrderController.cs
// (Bạn phải chắc chắn đã tạo file Controllers/OrderController.cs như hướng dẫn trước)
app.MapControllers(); 

app.Run();
