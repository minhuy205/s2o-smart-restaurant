using Microsoft.EntityFrameworkCore;
using MenuService.Models;

namespace MenuService.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Table> Tables => Set<Table>(); // <--- THÊM DÒNG NÀY
}