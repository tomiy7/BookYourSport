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

    public async Task<User?> GetUserByIdAsync(Guid id)
    {
        return await _dbContext.Users
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _dbContext.Users
            .FirstOrDefaultAsync(x => x.Email == email);
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _dbContext.Users
            .AnyAsync(x => x.Email == email);
    }

    public async Task AddUserAsync(User user)
    {
        await _dbContext.Users.AddAsync(user);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}