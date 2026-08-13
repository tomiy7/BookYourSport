using AuthService.API.Entities;

namespace AuthService.API.Services;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
}