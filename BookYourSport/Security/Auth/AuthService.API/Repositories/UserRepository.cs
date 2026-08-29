using AuthService.API.Data;
using AuthService.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AuthService.API.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _dbContext;

    public UserRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<User?> GetUserByEmailAsync(string email) =>
        await _dbContext.Users
            .FirstOrDefaultAsync(x => x.Email == email);

    public async Task<User?> GetUserByIdAsync(Guid userId) =>
        await _dbContext.Users
            .FirstOrDefaultAsync(x => x.Id == userId);

    public async Task<List<User>> GetUsersAsync(string? search)
    {
        var query = _dbContext.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();

            query = query.Where(x =>
                x.FirstName.ToLower().Contains(search) ||
                x.LastName.ToLower().Contains(search) ||
                x.Email.ToLower().Contains(search));
        }

        return await query
            .OrderBy(x => x.FirstName)
            .ThenBy(x => x.LastName)
            .ToListAsync();
    }

    public async Task<bool> EmailExistsAsync(string email) =>
        await _dbContext.Users
            .AnyAsync(x => x.Email == email);

    public async Task AddUserAsync(User user) =>
        await _dbContext.Users.AddAsync(user);

    public async Task SaveChangesAsync() =>
        await _dbContext.SaveChangesAsync();
}