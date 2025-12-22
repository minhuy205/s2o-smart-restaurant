using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MenuService.Data;
using MenuService.Models;

namespace MenuService.Controllers
{
    [Route("api/tables")]
    [ApiController]
    public class TableController : ControllerBase
    {
        private readonly AppDbContext _db;

        public TableController(AppDbContext db)
        {
            _db = db;
        }

        // 1. Lấy danh sách bàn
        [HttpGet]
        public async Task<IActionResult> GetTables([FromQuery] int tenantId)
        {
            if (tenantId <= 0) return BadRequest("Missing TenantId");
            return Ok(await _db.Tables.Where(t => t.TenantId == tenantId).OrderBy(t => t.Id).ToListAsync());
        }

        // 2. Thêm bàn mới
        [HttpPost]
        public async Task<IActionResult> CreateTable(Table table)
        {
            if (table.TenantId <= 0) return BadRequest("Invalid TenantId");
            table.Status = "Available";
            table.CurrentOrderId = null;
            
            _db.Tables.Add(table);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetTables), new { id = table.Id }, table);
        }

        // 3. Cập nhật trạng thái bàn (Gọi món / Thanh toán)
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, Table input)
        {
            var table = await _db.Tables.FindAsync(id);
            if (table is null) return NotFound();

            table.Status = input.Status;
            table.CurrentOrderId = input.CurrentOrderId;

            await _db.SaveChangesAsync();
            return Ok(table);
        }

        // 4. Sửa tên bàn
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTableName(int id, Table input)
        {
            var table = await _db.Tables.FindAsync(id);
            if (table is null) return NotFound();

            if (table.TenantId != input.TenantId) return Unauthorized();

            table.Name = input.Name;
            await _db.SaveChangesAsync();
            return Ok(table);
        }

        // 5. Xoá bàn
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTable(int id, [FromQuery] int tenantId)
        {
            var table = await _db.Tables.FindAsync(id);
            if (table is null) return NotFound();

            if (table.TenantId != tenantId) return Unauthorized();

            if (table.Status != "Available") 
            {
                return BadRequest(new { message = "Không thể xoá bàn đang có khách!" });
            }

            _db.Tables.Remove(table);
            await _db.SaveChangesAsync();
            
            return Ok(new { message = "Xoá thành công" });
        }
    }
}