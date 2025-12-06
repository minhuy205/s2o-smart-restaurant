var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
app.MapGet("/", () => "Tenant & Auth Service - S2O");
app.Run();
