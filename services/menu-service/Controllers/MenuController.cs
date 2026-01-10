using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MenuService.Data;
using MenuService.Models;

namespace MenuService.Controllers
{
    [Route("api/menu")]
    [ApiController]
    public class MenuController : ControllerBase
    {
        private readonly AppDbContext _db;

        public MenuController(AppDbContext db)
        {
            _db = db;
        }

        // 1. Lấy danh sách
        [HttpGet]
        public async Task<IActionResult> GetMenu([FromQuery] int tenantId)
        {
            if (tenantId <= 0) return BadRequest("Missing TenantId");
            return Ok(await _db.MenuItems.Where(m => m.TenantId == tenantId).ToListAsync());
        }

        // 2. Thêm món mới
        [HttpPost]
        public async Task<IActionResult> CreateMenu(MenuItem item)
        {
            if (item.TenantId <= 0) return BadRequest("Invalid TenantId");
            
            // Đảm bảo Status có giá trị mặc định nếu null
            if (string.IsNullOrEmpty(item.Status)) item.Status = "Available";

            _db.MenuItems.Add(item);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetMenu), new { id = item.Id }, item);
        }

        // 3. Sửa món ăn
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMenu(int id, MenuItem updatedItem)
        {
            var item = await _db.MenuItems.FindAsync(id);
            if (item is null) return NotFound();
            
            if (item.TenantId != updatedItem.TenantId) return Unauthorized();

            item.Name = updatedItem.Name;
            item.Price = updatedItem.Price;
            item.Description = updatedItem.Description;
            item.ImageUrl = updatedItem.ImageUrl;
            item.CategoryId = updatedItem.CategoryId;
            item.IsAvailable = updatedItem.IsAvailable;
            
            // --- MỚI: Cập nhật Status ---
            item.Status = updatedItem.Status;

            await _db.SaveChangesAsync();
            return Ok(item);
        }

        // 4. Xoá món ăn
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMenu(int id, [FromQuery] int tenantId)
        {
            var item = await _db.MenuItems.FindAsync(id);
            if (item is null) return NotFound();

            if (item.TenantId != tenantId) return Unauthorized();

            _db.MenuItems.Remove(item);
            await _db.SaveChangesAsync();
            return Ok();
        }
    }
}