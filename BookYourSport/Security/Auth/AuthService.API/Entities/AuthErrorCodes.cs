namespace AuthService.API.Entities;

public class AuthErrorCodes
{
    public const string EmailExists = "EMAIL_EXISTS";
    public const string InvalidCredentials = "INVALID_CREDENTIALS";
    public const string InvalidRefreshToken = "INVALID_REFRESH_TOKEN";
}