using Prometheus; // Thêm thư viện Monitoring

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

app.UseCors("AllowAll");

// --- THÊM DÒNG NÀY CHO PROMETHEUS ---
app.UseHttpMetrics(); 

app.MapReverseProxy();

// --- THÊM DÒNG NÀY ĐỂ XUẤT DATA METRICS ---
app.MapMetrics(); 

app.Run();