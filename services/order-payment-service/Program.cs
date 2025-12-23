using OrderPaymentService.Data;
using Microsoft.EntityFrameworkCore;
using MassTransit; 
using OrderPaymentService.Services;
using Prometheus; // <-- 1. Thêm thư viện Monitoring

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
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host("rabbitmq", "/", h => {
            h.Username("guest");
            h.Password("guest");
        });
    });
});

// ==========================================
// 3. CẤU HÌNH SERVICES & CONTROLLERS
// ==========================================
builder.Services.AddSingleton<NotificationService>();
builder.Services.AddControllers(); 
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

// ==========================================
// 4. PIPELINE (LUỒNG XỬ LÝ)
// ==========================================

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAll");

// --- 2. THEO DÕI CÁC REQUEST HTTP ---
app.UseHttpMetrics(); 

app.UseAuthorization();

// Tự động map các Controller
app.MapControllers(); 

// --- 3. XUẤT DỮ LIỆU METRICS CHO PROMETHEUS ---
app.MapMetrics(); 

// Tự động chạy Migration
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