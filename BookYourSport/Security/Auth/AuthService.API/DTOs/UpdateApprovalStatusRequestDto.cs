using System.ComponentModel.DataAnnotations;

namespace AuthService.API.DTOs;

public class UpdateApprovalStatusRequestDto
{
    [Required]
    public string ApprovalStatus { get; set; } = string.Empty;
}