using Microsoft.EntityFrameworkCore;
using MenuService.Data;
using MenuService.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Kết nối Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=postgres;Port=5432;Database=menu_db;Username=s2o;Password=h9minhhuy";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();
app.UseCors("AllowAll");

// --- CÁC API MENU (CÓ TENANT) ---

// 1. Lấy danh sách (Lọc theo TenantId)
// Gọi: GET /api/menu?tenantId=1
app.MapGet("/api/menu", async (int tenantId, AppDbContext db) =>
{
    if (tenantId <= 0) return Results.BadRequest("Missing TenantId");
    return Results.Ok(await db.MenuItems.Where(m => m.TenantId == tenantId).ToListAsync());
});

// 2. Thêm món mới (Gán TenantId)
app.MapPost("/api/menu", async (MenuItem item, AppDbContext db) =>
{
    if (item.TenantId <= 0) return Results.BadRequest("Invalid TenantId");
    
    db.MenuItems.Add(item);
    await db.SaveChangesAsync();
    return Results.Created($"/api/menu/{item.Id}", item);
});

// 3. Sửa món ăn (Kiểm tra TenantId chính chủ)
app.MapPut("/api/menu/{id}", async (int id, MenuItem updatedItem, AppDbContext db) =>
{
    var item = await db.MenuItems.FindAsync(id);
    if (item is null) return Results.NotFound();
    
    // Kiểm tra món này có thuộc về Tenant đang gửi request không
    if (item.TenantId != updatedItem.TenantId) return Results.Unauthorized();

    item.Name = updatedItem.Name;
    item.Price = updatedItem.Price;
    item.Description = updatedItem.Description;
    item.ImageUrl = updatedItem.ImageUrl;
    item.CategoryId = updatedItem.CategoryId;
    item.IsAvailable = updatedItem.IsAvailable;
    // Không sửa TenantId

    await db.SaveChangesAsync();
    return Results.Ok(item);
});

// 4. Xoá món ăn (Kiểm tra TenantId)
// Gọi: DELETE /api/menu/{id}?tenantId=1
app.MapDelete("/api/menu/{id}", async (int id, int tenantId, AppDbContext db) =>
{
    var item = await db.MenuItems.FindAsync(id);
    if (item is null) return Results.NotFound();

    if (item.TenantId != tenantId) return Results.Unauthorized();

    db.MenuItems.Remove(item);
    await db.SaveChangesAsync();
    return Results.Ok();
});

app.MapGet("/", () => "Menu Service is Running!");

app.Run();