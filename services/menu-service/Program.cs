using Microsoft.EntityFrameworkCore;
using MenuService.Data;
using MenuService.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Kết nối Database
// Đảm bảo Connection String đúng với cấu hình Docker của bạn
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

// --- CÁC API MENU (MÓN ĂN) ---

// 1. Lấy danh sách (Lọc theo TenantId)
app.MapGet("/api/menu", async (int tenantId, AppDbContext db) =>
{
    if (tenantId <= 0) return Results.BadRequest("Missing TenantId");
    return Results.Ok(await db.MenuItems.Where(m => m.TenantId == tenantId).ToListAsync());
});

// 2. Thêm món mới
app.MapPost("/api/menu", async (MenuItem item, AppDbContext db) =>
{
    if (item.TenantId <= 0) return Results.BadRequest("Invalid TenantId");
    db.MenuItems.Add(item);
    await db.SaveChangesAsync();
    return Results.Created($"/api/menu/{item.Id}", item);
});

// 3. Sửa món ăn
app.MapPut("/api/menu/{id}", async (int id, MenuItem updatedItem, AppDbContext db) =>
{
    var item = await db.MenuItems.FindAsync(id);
    if (item is null) return Results.NotFound();
    
    if (item.TenantId != updatedItem.TenantId) return Results.Unauthorized();

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
app.MapDelete("/api/menu/{id}", async (int id, int tenantId, AppDbContext db) =>
{
    var item = await db.MenuItems.FindAsync(id);
    if (item is null) return Results.NotFound();

    if (item.TenantId != tenantId) return Results.Unauthorized();

    db.MenuItems.Remove(item);
    await db.SaveChangesAsync();
    return Results.Ok();
});

// --- CÁC API TABLES (QUẢN LÝ BÀN) ---

// 1. Lấy danh sách bàn
app.MapGet("/api/tables", async (int tenantId, AppDbContext db) =>
{
    if (tenantId <= 0) return Results.BadRequest("Missing TenantId");
    return Results.Ok(await db.Tables.Where(t => t.TenantId == tenantId).OrderBy(t => t.Id).ToListAsync());
});

// 2. Thêm bàn mới (Setup quán)
app.MapPost("/api/tables", async (Table table, AppDbContext db) =>
{
    if (table.TenantId <= 0) return Results.BadRequest("Invalid TenantId");
    table.Status = "Available";
    table.CurrentOrderId = null;
    
    db.Tables.Add(table);
    await db.SaveChangesAsync();
    return Results.Created($"/api/tables/{table.Id}", table);
});

// 3. Cập nhật trạng thái bàn (Dùng cho POS khi Gọi món / Cashier khi Thanh toán)
app.MapPut("/api/tables/{id}/status", async (int id, Table input, AppDbContext db) =>
{
    var table = await db.Tables.FindAsync(id);
    if (table is null) return Results.NotFound();

    // Chỉ cập nhật trạng thái
    table.Status = input.Status;
    table.CurrentOrderId = input.CurrentOrderId;

    await db.SaveChangesAsync();
    return Results.Ok(table);
});

// 4. Sửa tên bàn (API MỚI - Đổi tên)
app.MapPut("/api/tables/{id}", async (int id, Table input, AppDbContext db) =>
{
    var table = await db.Tables.FindAsync(id);
    if (table is null) return Results.NotFound();

    // Kiểm tra quyền sở hữu
    if (table.TenantId != input.TenantId) return Results.Unauthorized();

    table.Name = input.Name;
    // Lưu ý: Không cập nhật Status/CurrentOrderId ở đây để tránh conflict luồng bán hàng

    await db.SaveChangesAsync();
    return Results.Ok(table);
});

// 5. Xoá bàn (API MỚI)
app.MapDelete("/api/tables/{id}", async (int id, int tenantId, AppDbContext db) =>
{
    var table = await db.Tables.FindAsync(id);
    if (table is null) return Results.NotFound();

    if (table.TenantId != tenantId) return Results.Unauthorized();

    // Logic nghiệp vụ: Chỉ cho phép xoá bàn TRỐNG
    if (table.Status != "Available") 
    {
        return Results.BadRequest(new { message = "Không thể xoá bàn đang có khách!" });
    }

    db.Tables.Remove(table);
    await db.SaveChangesAsync();
    
    // --- SỬA DÒNG NÀY ---
    // Thay vì Results.Ok(), hãy trả về object để Frontend parse được JSON
    return Results.Ok(new { message = "Xoá thành công" }); 
});

app.MapGet("/", () => "Menu Service is Running!");

app.Run();