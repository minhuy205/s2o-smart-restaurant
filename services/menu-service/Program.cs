// var builder = WebApplication.CreateBuilder(args);
// var app = builder.Build();
// app.MapGet("/", () => "Menu Service - S2O");
// app.Run();

using Microsoft.EntityFrameworkCore;
using MenuService.Data;
using MenuService.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình kết nối Database 
// Lưu ý: "Host=postgres" là tên service trong Docker, "Password=h9minhhuy" là mật khẩu mới của bạn
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=postgres;Port=5432;Database=s2o_db;Username=s2o;Password=h9minhhuy";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Cấu hình CORS (Cho phép Frontend gọi API)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

app.UseCors("AllowAll");

// 3. Định nghĩa các API (Endpoints)

// API: Lấy danh sách tất cả món ăn
app.MapGet("/api/menu", async (AppDbContext db) =>
    await db.MenuItems.ToListAsync());

// API: Thêm món ăn mới
app.MapPost("/api/menu", async (MenuItem item, AppDbContext db) =>
{
    db.MenuItems.Add(item);
    await db.SaveChangesAsync();
    return Results.Created($"/api/menu/{item.Id}", item);
});

// API: Xoá món ăn theo ID
app.MapDelete("/api/menu/{id}", async (int id, AppDbContext db) =>
{
    var item = await db.MenuItems.FindAsync(id);
    if (item is null) return Results.NotFound();

    db.MenuItems.Remove(item);
    await db.SaveChangesAsync();
    return Results.Ok();
});

// API kiểm tra service sống hay chết
app.MapGet("/", () => "Menu Service is Running & Connected to DB!");

app.Run();