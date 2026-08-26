using AuthService.API.DTOs;
using AuthService.API.Entities;
using AuthService.API.Repositories;
using AuthService.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.API.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
    private readonly IConfiguration _config;
    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly ITokenService _tokenService;

    public AuthController(
        ILogger<AuthController> logger,
        IConfiguration config,
        IUserRepository userRepository,
        IRefreshTokenRepository refreshTokenRepository,
        ITokenService tokenService)
    {
        _logger = logger;
        _config = config;
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _tokenService = tokenService;
    }

    // =========================
    // AUTH ENDPOINTS
    // =========================

    [HttpPost("register")]
    [ProducesResponseType(
        typeof(AuthResponseDto),
        StatusCodes.Status201Created)]
    [ProducesResponseType(
        typeof(ErrorResponseDto),
        StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RegisterAsync(
        RegisterRequestDto registerRequestDto)
    {
        if (await _userRepository.EmailExistsAsync(
                registerRequestDto.Email))
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
            Role = Roles.Player,

            ApprovalStatus = ApprovalStatuses.NotRequested,
            ContractStatus = ContractStatuses.NotGenerated,
            SubscriptionStatus = SubscriptionStatuses.NotStarted
        };

        await _userRepository.AddUserAsync(user);
        await _userRepository.SaveChangesAsync();

        _logger.LogInformation(
            "User {Email} successfully registered. Id: {UserId}",
            user.Email,
            user.Id);

        var tokens = await IssueTokens(user);

        return StatusCode(
            StatusCodes.Status201Created,
            tokens);
    }

    [HttpPost("login")]
    [ProducesResponseType(
        typeof(AuthResponseDto),
        StatusCodes.Status200OK)]
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

        var tokens = await IssueTokens(user);

        return Ok(tokens);
    }

    [HttpPost("refresh")]
    [ProducesResponseType(
        typeof(AuthResponseDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        typeof(ErrorResponseDto),
        StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshAsync(
        RefreshRequestDto refreshRequestDto)
    {
        var storedToken =
            await _refreshTokenRepository.GetByTokenAsync(
                refreshRequestDto.RefreshToken);

        if (storedToken == null || !storedToken.IsActive)
        {
            _logger.LogWarning(
                "Invalid or expired refresh token attempted");

            return Unauthorized(new ErrorResponseDto
            {
                Error = AuthErrorCodes.InvalidRefreshToken,
                Message = "Refresh token is invalid or expired."
            });
        }

        storedToken.RevokedAt = DateTime.UtcNow;

        _logger.LogInformation(
            "Refresh token used for user {UserId}",
            storedToken.UserId);

        var tokens = await IssueTokens(storedToken.User);

        await _refreshTokenRepository.SaveChangesAsync();

        return Ok(tokens);
    }

    // =========================
    // ADMIN USER ENDPOINTS
    // =========================

    [HttpGet("users")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(
        typeof(IEnumerable<UserResponseDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUsersAsync(
        [FromQuery] string? search)
    {
        var users = await _userRepository.GetUsersAsync(search);

        var response = users.Select(user => new UserResponseDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            City = user.City,
            DateOfBirth = user.DateOfBirth,
            Role = user.Role,
            ApprovalStatus = user.ApprovalStatus,
            ContractStatus = user.ContractStatus,
            SubscriptionStatus = user.SubscriptionStatus
        });

        return Ok(response);
    }

    [HttpGet("users/{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(
        typeof(UserResponseDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserByIdAsync(Guid id)
    {
        var user = await _userRepository.GetUserByIdAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        var response = new UserResponseDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            City = user.City,
            DateOfBirth = user.DateOfBirth,
            Role = user.Role,
            ApprovalStatus = user.ApprovalStatus,
            ContractStatus = user.ContractStatus,
            SubscriptionStatus = user.SubscriptionStatus
        };

        return Ok(response);
    }

    // =========================
    // UPDATE APPROVAL STATUS
    // =========================

    [HttpPatch("users/{id:guid}/approval-status")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(
        typeof(UserResponseDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        typeof(ErrorResponseDto),
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateApprovalStatusAsync(
        Guid id,
        UpdateApprovalStatusRequestDto request)
    {
        var user = await _userRepository.GetUserByIdAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        var validStatuses = new[]
        {
            ApprovalStatuses.NotRequested,
            ApprovalStatuses.Requested,
            ApprovalStatuses.Approved,
            ApprovalStatuses.Rejected
        };

        if (!validStatuses.Contains(request.ApprovalStatus))
        {
            return BadRequest(new ErrorResponseDto
            {
                Error = "invalid_approval_status",
                Message =
                    $"Invalid approval status. Allowed values are: " +
                    $"{string.Join(", ", validStatuses)}."
            });
        }

        var oldStatus = user.ApprovalStatus;

        user.ApprovalStatus = request.ApprovalStatus;

        await _userRepository.SaveChangesAsync();

        _logger.LogInformation(
            "Approval status for user {UserId} changed from {OldStatus} to {NewStatus}",
            user.Id,
            oldStatus,
            user.ApprovalStatus);

        var response = new UserResponseDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            City = user.City,
            DateOfBirth = user.DateOfBirth,
            Role = user.Role,
            ApprovalStatus = user.ApprovalStatus,
            ContractStatus = user.ContractStatus,
            SubscriptionStatus = user.SubscriptionStatus
        };

        return Ok(response);
    }

    // =========================
    // ROLE TEST ENDPOINTS
    // =========================

    [HttpGet("test/player")]
    [Authorize(Roles = Roles.Player)]
    public IActionResult PlayerTest()
    {
        return Ok(new
        {
            message = "You have access to the player endpoint."
        });
    }

    [HttpGet("test/club")]
    [Authorize(Roles = Roles.Club)]
    public IActionResult ClubTest()
    {
        return Ok(new
        {
            message = "You have access to the club endpoint."
        });
    }

    [HttpGet("test/admin")]
    [Authorize(Roles = Roles.Admin)]
    public IActionResult AdminTest()
    {
        return Ok(new
        {
            message = "You have access to the admin endpoint."
        });
    }

    // =========================
    // TOKEN GENERATION
    // =========================

    private async Task<AuthResponseDto> IssueTokens(User user)
    {
        var accessToken = _tokenService.GenerateAccessToken(user);

        var refreshTokenValue =
            _tokenService.GenerateRefreshToken();

        var refreshTokenDays = _config.GetValue<int>(
            "Jwt:RefreshTokenDays",
            60);

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(
                refreshTokenDays)
        };

        await _refreshTokenRepository.AddAsync(refreshToken);
        await _refreshTokenRepository.SaveChangesAsync();

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenValue
        };
    }
}