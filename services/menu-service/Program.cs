using MenuService.Data;
using Microsoft.EntityFrameworkCore;
using MassTransit; // Thư viện RabbitMQ
using MenuService.Consumers; // Nơi chứa Consumer
using OrderPaymentService.Events; // Nơi chứa Event Class
using Prometheus; // <-- 1. Thêm namespace Monitoring

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. CẤU HÌNH DATABASE
// ==========================================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=postgres;Port=5432;Database=menu_db;Username=s2o;Password=h9minhhuy";
    // ?? "Host=localhost;Port=5432;Database=menu_db;Username=s2o;Password=h9minhhuy";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// ==========================================
// 2. CẤU HÌNH RABBITMQ (CONSUMER)
// ==========================================
builder.Services.AddMassTransit(x =>
{
    // Đăng ký Consumer
    x.AddConsumer<OrderCreatedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        // "rabbitmq" là tên service trong docker-compose.yml
        cfg.Host("rabbitmq", "/", h => {
        // cfg.Host("localhost", "/", h => {
            h.Username("guest");
            h.Password("guest");
        });

        // Định nghĩa Queue nhận tin
        cfg.ReceiveEndpoint("order-created-queue", e =>
        {
            e.ConfigureConsumer<OrderCreatedConsumer>(context);
        });
    });
});

// ==========================================
// 3. CẤU HÌNH CONTROLLERS & SWAGGER
// ==========================================
builder.Services.AddControllers(); // Kích hoạt Controller
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

// Tự động Migration DB
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// Map các Controller
app.MapControllers();

// --- 3. XUẤT DỮ LIỆU METRICS CHO PROMETHEUS ---
app.MapMetrics(); 

app.Run();
// app.Run("http://0.0.0.0:5001");