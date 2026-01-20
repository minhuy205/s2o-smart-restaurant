using Microsoft.EntityFrameworkCore;
using TenantAuthService.Data;
using TenantAuthService.Endpoints;
using Prometheus; // Thêm thư viện Monitoring

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=postgres;Port=5432;Database=auth_db;Username=s2o;Password=h9minhhuy";

    // ?? "Host=localhost;Port=5432;Database=auth_db;Username=s2o;Password=h9minhhuy";

builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Cấu hình CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddAuthentication().AddJwtBearer();
builder.Services.AddAuthorization();

var app = builder.Build();

// 3. MIDDLEWARE & MONITORING
app.UseCors("AllowAll");

// --- THÊM DÒNG NÀY CHO PROMETHEUS ---
app.UseHttpMetrics(); 

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "Tenant Auth Service is Running...");

// 4. MAP ENDPOINTS & METRICS
app.MapAuthEndpoints();

// --- THÊM DÒNG NÀY ĐỂ XUẤT DATA METRICS ---
app.MapMetrics(); 

using (var scope = app.Services.CreateScope())
{
    try {
        var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        db.Database.EnsureCreated();

        // Ensure missing columns are added when model changes but database already exists
        // Note: EnsureCreated does not apply incremental schema changes, so we patch critical columns here
        db.Database.ExecuteSqlRaw("ALTER TABLE \"Tenants\" ADD COLUMN IF NOT EXISTS \"Email\" text");
    } catch (Exception ex) {
        Console.WriteLine($"Lỗi tạo DB: {ex.Message}");
    }
}

app.Run();