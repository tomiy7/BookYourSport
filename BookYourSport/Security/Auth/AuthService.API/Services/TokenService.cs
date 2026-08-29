using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AuthService.API.Entities;
using Microsoft.IdentityModel.Tokens;

namespace AuthService.API.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateAccessToken(User user)
    {
        var secret = _config["Jwt:Secret"]
                     ?? throw new InvalidOperationException(
                         "Jwt:Secret is not configured."
                     );

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(secret)
        );

        var accessTokenMinutes = _config.GetValue<int>(
            "Jwt:AccessTokenMinutes",
            60
        );

        var claims = new[]
        {
            // ID korisnika - koristimo ga da pronađemo trenutno
            // ulogovanog korisnika iz JWT tokena
            new Claim(
                ClaimTypes.NameIdentifier,
                user.Id.ToString()
            ),

            // Email se nalazi u tokenu, ali se neće menjati
            // preko Edit Profile stranice
            new Claim(
                ClaimTypes.Email,
                user.Email
            ),

            // Trenutni podaci korisnika
            new Claim(
                ClaimTypes.GivenName,
                user.FirstName
            ),

            new Claim(
                ClaimTypes.Surname,
                user.LastName
            ),

            // Role korisnika
            new Claim(
                ClaimTypes.Role,
                user.Role
            )
        };

        var token = new JwtSecurityToken(
            claims: claims,

            expires: DateTime.UtcNow.AddMinutes(
                accessTokenMinutes
            ),

            signingCredentials: new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            )
        );

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];

        using var rng = RandomNumberGenerator.Create();

        rng.GetBytes(randomBytes);

        return Convert.ToBase64String(randomBytes);
    }
}