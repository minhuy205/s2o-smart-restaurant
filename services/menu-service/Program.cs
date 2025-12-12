using Microsoft.EntityFrameworkCore;
using MenuService.Data;
using MenuService.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Kết nối Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=postgres;Port=5432;Database=s2o_db;Username=s2o;Password=h9minhhuy";

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

// 1. Lấy danh sách
app.MapGet("/api/menu", async (AppDbContext db) =>
    await db.MenuItems.ToListAsync());

// 2. Thêm món mới
app.MapPost("/api/menu", async (MenuItem item, AppDbContext db) =>
{
    db.MenuItems.Add(item);
    await db.SaveChangesAsync();
    return Results.Created($"/api/menu/{item.Id}", item);
});

// 3. Sửa món ăn (API MỚI)
app.MapPut("/api/menu/{id}", async (int id, MenuItem updatedItem, AppDbContext db) =>
{
    var item = await db.MenuItems.FindAsync(id);
    if (item is null) return Results.NotFound();

    // Cập nhật thông tin
    item.Name = updatedItem.Name;
    item.Price = updatedItem.Price;
    item.Description = updatedItem.Description;
    item.ImageUrl = updatedItem.ImageUrl;
    item.CategoryId = updatedItem.CategoryId;
    item.IsAvailable = updatedItem.IsAvailable;

    await db.SaveChangesAsync();
    return Results.Ok(item);
});

// 4. Xoá món ăn
app.MapDelete("/api/menu/{id}", async (int id, AppDbContext db) =>
{
    var item = await db.MenuItems.FindAsync(id);
    if (item is null) return Results.NotFound();

    db.MenuItems.Remove(item);
    await db.SaveChangesAsync();
    return Results.Ok();
});

app.MapGet("/", () => "Menu Service is Running!");

app.Run();