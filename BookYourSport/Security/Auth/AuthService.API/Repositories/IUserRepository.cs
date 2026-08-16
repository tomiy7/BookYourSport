using AuthService.API.Entities;

namespace AuthService.API.Repositories;

public interface IUserRepository
{
    Task<User?> GetUserByEmailAsync(string email);
    Task<bool> EmailExistsAsync(string email);
    Task AddUserAsync(User user);
    Task SaveChangesAsync();
}