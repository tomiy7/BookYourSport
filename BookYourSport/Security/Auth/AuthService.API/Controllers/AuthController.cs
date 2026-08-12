using AuthService.API.DTOs;
using AuthService.API.Entities;
using AuthService.API.Repositories;
using AuthService.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.API.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;

    public AuthController(
        ILogger<AuthController> logger,
        IUserRepository userRepository,
        ITokenService tokenService)
    {
        _logger = logger;
        _userRepository = userRepository;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RegisterAsync(
        RegisterRequestDto registerRequestDto)
    {
        if (await _userRepository.EmailExistsAsync(registerRequestDto.Email))
        {
            _logger.LogWarning(
                "Registration failed: email {Email} already exists",
                registerRequestDto.Email);

            return Conflict(new ErrorResponseDto
            {
                Error = AuthErrorCodes.EmailExists,
                Message = "Email already exists"
            });
        }

        var user = new User
        {
            FirstName = registerRequestDto.FirstName,
            LastName = registerRequestDto.LastName,
            Email = registerRequestDto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                registerRequestDto.Password),
            City = registerRequestDto.City,
            DateOfBirth = registerRequestDto.DateOfBirth,
            Role = Roles.Player
        };

        await _userRepository.AddUserAsync(user);
        await _userRepository.SaveChangesAsync();

        _logger.LogInformation(
            "User {Email} successfully registered. Id: {UserId}",
            user.Email,
            user.Id);

        var accessToken = _tokenService.GenerateAccessToken(user);

        return StatusCode(
            StatusCodes.Status201Created,
            new AuthResponseDto
            {
                AccessToken = accessToken
            });
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(
        typeof(ErrorResponseDto),
        StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LoginAsync(
        LoginRequestDto loginRequestDto)
    {
        var user = await _userRepository.GetUserByEmailAsync(
            loginRequestDto.Email);

        if (user == null ||
            !BCrypt.Net.BCrypt.Verify(
                loginRequestDto.Password,
                user.PasswordHash))
        {
            _logger.LogWarning(
                "Failed login attempt for email {Email}",
                loginRequestDto.Email);

            return Unauthorized(new ErrorResponseDto
            {
                Error = AuthErrorCodes.InvalidCredentials,
                Message = "Wrong email or password."
            });
        }

        _logger.LogInformation(
            "User {Email} successfully logged in",
            user.Email);

        var accessToken = _tokenService.GenerateAccessToken(user);

        return Ok(new AuthResponseDto
        {
            AccessToken = accessToken
        });
    }
}