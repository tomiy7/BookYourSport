using System.Security.Claims;
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
    
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LogoutAsync(RefreshRequestDto refreshRequestDto)
    {
        var storedToken = await _refreshTokenRepository.GetByTokenAsync(refreshRequestDto.RefreshToken);

        if (storedToken != null)
        {
            storedToken.RevokedAt = DateTime.UtcNow;
            await _refreshTokenRepository.SaveChangesAsync();
            _logger.LogInformation("User logged out: {UserId}", storedToken.UserId);
        }
        else
        {
            _logger.LogWarning("Logout attempted with unknown or already-revoked refresh token");
        }
        
        return Ok(new { message = "Successfuly logged out" });
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
    
    [HttpGet("admin/pending-approvals")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingApprovalsAsync()
    {
        var users = await _userRepository.GetUsersByApprovalStatusAsync(ApprovalStatuses.Requested);

        return Ok(users.Select(u => new
        {
            u.Id,
            u.FirstName,
            u.LastName,
            u.Email,
            u.City,
            u.ApprovalStatus
        }));
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
        if (request.ApprovalStatus != ApprovalStatuses.Approved && request.ApprovalStatus != ApprovalStatuses.Rejected)
        {
            return BadRequest(new ErrorResponseDto
            {
                Error = "invalid_status",
                Message = "Approval status can only be set to Approved or Rejected."
            });
        }
        
        var user = await _userRepository.GetUserByIdAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        var oldStatus = user.ApprovalStatus;

        user.ApprovalStatus = request.ApprovalStatus;

        await _userRepository.SaveChangesAsync();

        _logger.LogInformation(
            "Approval status for user {UserId} changed from {OldStatus} to {NewStatus}",
            user.Id, oldStatus, user.ApprovalStatus);

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
    // UPDATE USER ROLE
    // =========================

    [HttpPatch("users/{id:guid}/role")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(
        typeof(UserResponseDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        typeof(ErrorResponseDto),
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUserRoleAsync(
        Guid id,
        UpdateUserRoleRequestDto request)
    {
        var user = await _userRepository.GetUserByIdAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        var validRoles = new[]
        {
            Roles.Player,
            Roles.Club,
            Roles.Admin
        };

        if (!validRoles.Contains(request.Role))
        {
            return BadRequest(new ErrorResponseDto
            {
                Error = "invalid_role",
                Message =
                    $"Invalid role. Allowed values are: " +
                    $"{string.Join(", ", validRoles)}."
            });
        }

        if (request.Role == Roles.Club &&
            user.ApprovalStatus != ApprovalStatuses.Approved)
        {
            return BadRequest(new ErrorResponseDto
            {
                Error = "club_role_requires_approval",
                Message =
                    "User must be approved before being assigned the club role."
            });
        }

        var oldRole = user.Role;

        user.Role = request.Role;

        await _userRepository.SaveChangesAsync();

        _logger.LogInformation(
            "Role for user {UserId} changed from {OldRole} to {NewRole}",
            user.Id,
            oldRole,
            user.Role);

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
    // PAYMENT / CONTRACT NOTIFICATIONS
    // =========================
    
    [HttpGet("internal/users/{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetUserInternalAsync(Guid id)
    {
        var user = await _userRepository.GetUserByIdAsync(id);
        if (user == null) return NotFound();

        return Ok(new
        {
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            user.ApprovalStatus
        });
    }

    [HttpPost("contract-generated")]
    [AllowAnonymous]
    public async Task<IActionResult> ContractGeneratedAsync(
        ContractGeneratedNotificationDto request)
    {
        var user = await _userRepository.GetUserByIdAsync(
            request.UserId);

        if (user == null)
        {
            return NotFound();
        }

        user.ContractStatus = ContractStatuses.Generated;

        await _userRepository.SaveChangesAsync();

        _logger.LogInformation(
            "Contract {ContractId} generated for user {UserId}",
            request.ContractId,
            user.Id);

        return Ok(new
        {
            user.Id,
            user.Role,
            user.ApprovalStatus,
            user.ContractStatus,
            user.SubscriptionStatus
        });
    }

    [HttpPost("contract-signed")]
    [AllowAnonymous]
    public async Task<IActionResult> ContractSignedAsync(
        ContractSignedNotificationDto request)
    {
        var user = await _userRepository.GetUserByIdAsync(
            request.UserId);

        if (user == null)
        {
            return NotFound();
        }

        user.ContractStatus = ContractStatuses.Signed;

        TryAssignClubRole(user);

        await _userRepository.SaveChangesAsync();

        _logger.LogInformation(
            "Contract {ContractId} signed for user {UserId}",
            request.ContractId,
            user.Id);

        return Ok(new
        {
            user.Id,
            user.Role,
            user.ApprovalStatus,
            user.ContractStatus,
            user.SubscriptionStatus
        });
    }

    [HttpPost("subscription-paid")]
    [AllowAnonymous]
    public async Task<IActionResult> SubscriptionPaidAsync(
        SubscriptionPaidNotificationDto request)
    {
        var user = await _userRepository.GetUserByIdAsync(
            request.UserId);

        if (user == null)
        {
            return NotFound();
        }

        user.SubscriptionStatus = SubscriptionStatuses.Paid;

        TryAssignClubRole(user);

        await _userRepository.SaveChangesAsync();

        _logger.LogInformation(
            "Subscription payment {PaymentId} successful for user {UserId}",
            request.PaymentId,
            user.Id);

        return Ok(new
        {
            user.Id,
            user.Role,
            user.ApprovalStatus,
            user.ContractStatus,
            user.SubscriptionStatus
        });
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
    // CLUB OWNERSHIP REQUEST
    // =========================

    [HttpPost("request-club-ownership")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RequestClubOwnershipAsync()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _userRepository.GetUserByIdAsync(userId);

        if (user == null) return NotFound();

        if (user.ApprovalStatus != ApprovalStatuses.NotRequested)
        {
            return BadRequest(new ErrorResponseDto
            {
                Error = "already_requested",
                Message = "Club ownership has already been requested or processed."
            });
        }

        user.ApprovalStatus = ApprovalStatuses.Requested;
        await _userRepository.SaveChangesAsync();

        _logger.LogInformation("User {UserId} requested club ownership", user.Id);

        return Ok(new { user.Id, user.ApprovalStatus });
    }
    
    // =========================
    // HELPERS
    // =========================

    private static void TryAssignClubRole(User user)
    {
        var canBeApproved =
            user.ApprovalStatus == ApprovalStatuses.Approved &&
            user.ContractStatus == ContractStatuses.Signed &&
            user.SubscriptionStatus == SubscriptionStatuses.Paid;

        if (!canBeApproved)
            return;
        
        user.Role = Roles.Club;
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