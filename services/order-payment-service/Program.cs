// var builder = WebApplication.CreateBuilder(args);
// var app = builder.Build();
// app.MapGet("/", () => "Order & Payment Service - S2O");
// app.Run();
using Microsoft.EntityFrameworkCore;
using OrderPaymentService.Data;
using OrderPaymentService.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Kết nối Database (Dùng chung DB s2o_db với Menu Service) // SỬA THÀNH (Đổi s2o_db -> oder_db):
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=postgres;Port=5432;Database=order_db;Username=s2o;Password=h9minhhuy";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();
app.UseCors("AllowAll");

// --- CÁC API ---

// 1. Lấy tất cả đơn hàng (Kèm theo món ăn bên trong)
app.MapGet("/api/orders", async (AppDbContext db) =>
    await db.Orders.Include(o => o.Items).OrderByDescending(o => o.CreatedAt).ToListAsync());

// 2. Tạo đơn hàng mới
app.MapPost("/api/orders", async (Order order, AppDbContext db) =>
{
    order.CreatedAt = DateTime.UtcNow;
    order.Status = "Pending"; // Mặc định là chờ nấu
    db.Orders.Add(order);
    await db.SaveChangesAsync();
    return Results.Created($"/api/orders/{order.Id}", order);
});

// 3. Cập nhật trạng thái (VD: Pending -> Cooking -> Paid)
app.MapPut("/api/orders/{id}/status", async (int id, string status, AppDbContext db) =>
{
    var order = await db.Orders.FindAsync(id);
    if (order is null) return Results.NotFound();

    order.Status = status;
    await db.SaveChangesAsync();
    return Results.Ok(order);
});

app.MapGet("/", () => "Order Service is Running!");

app.Run();