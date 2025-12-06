var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
app.MapGet("/", () => "Customer & Reservation Service - S2O");
app.Run();
