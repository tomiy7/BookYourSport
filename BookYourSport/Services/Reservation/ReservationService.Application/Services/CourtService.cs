using System.Runtime.CompilerServices;
using Microsoft.Extensions.Logging;
using ReservationService.Application.DTOs;
using ReservationService.Application.Interfaces;
using ReservationService.Domain.Entities;
using ReservationService.Domain.Interfaces;
using ReservationService.Domain.ValueObjects;

namespace ReservationService.Application.Services;

public class CourtService : ICourtService
{
    private readonly IClubRepository _clubRepository;
    private readonly ILogger<CourtService> _logger;

    public CourtService(IClubRepository clubRepository,  ILogger<CourtService> logger)
    {
        _clubRepository = clubRepository;
        _logger = logger;
    }
    
    public async Task<List<CourtDto>?> GetByClubIdAsync(Guid clubId)
    {
        var club = await _clubRepository.GetByIdAsync(clubId);
        if (club == null)
        {
            _logger.LogWarning("Attempted to list courts for non-existent club {ClubId}", clubId);
            return null;
        }
        
        return club.Courts.Select(MapToDto).ToList();
    }

    public async Task<CourtDto?> GetCourtByIdAsync(Guid clubId, Guid courtId)
    {
        var club = await _clubRepository.GetByIdAsync(clubId);
        var court = club?.Courts.FirstOrDefault(c => c.Id == courtId);
        
        if (court == null)
            _logger.LogWarning("Court {CourtId} not found in club {ClubId}", courtId, clubId);

        return court == null ? null : MapToDto(court);
    }

    public async Task<CourtDto?> CreateCourtAsync(Guid clubId, CreateCourtDto courtDto)
    {
        var club = await _clubRepository.GetByIdAsync(clubId);
        if (club == null)
        {
            _logger.LogWarning("Attempted to add court to non-existent club {ClubId}", clubId);
            return null;
        }
        
        var price = Price.Create(courtDto.PricePerHour,  courtDto.Currency);
        var court = club.AddCourt(courtDto.Name, courtDto.SurfaceType, courtDto.IsIndoor, price);
        
        _clubRepository.Update(club);
        await _clubRepository.SaveChangesAsync();
        
        _logger.LogInformation("Court '{CourtName}' added to club {ClubName}", court.Name, club.Name);
        
        return MapToDto(court);
    }

    public async Task<CourtDto?> UpdateCourtAsync(Guid clubId, Guid courtId, UpdateCourtDto courtDto)
    {
        var club = await _clubRepository.GetByIdAsync(clubId);
        var court = club?.Courts.FirstOrDefault(c => c.Id == courtId);
        
        if (club == null || court == null)
        {
            _logger.LogWarning("Attempted to update non-existent court {CourtId} in club {ClubId}", courtId, clubId);
            return null;
        }
        
        var price = Price.Create(courtDto.PricePerHour, courtDto.Currency);
        court.UpdateDetails(courtDto.Name, courtDto.SurfaceType, courtDto.IsIndoor, price);
        
        if (courtDto.IsActive) court.Activate(); else court.Deactivate();
        
        _clubRepository.Update(club);
        await _clubRepository.SaveChangesAsync();
        
        _logger.LogInformation("Court {CourtName} updated in club {ClubName}", court.Name, club.Name);
        
        return MapToDto(court);
    }

    public async Task<bool> DeleteCourtAsync(Guid clubId, Guid courtId)
    {
        var club = await _clubRepository.GetByIdAsync(clubId);
        if (club == null || club.Courts.All(c => c.Id != courtId))
        {
            _logger.LogWarning("Attempted to delete non-existent court {CourtId} in club {ClubId}", courtId, clubId);
            return false;
        }
        
        club!.RemoveCourt(courtId);
        
        _clubRepository.Update(club);
        await _clubRepository.SaveChangesAsync();
        
        _logger.LogInformation("Court {CourtId} deleted from club {ClubId}", courtId, clubId);
        return true;
    }

    private static CourtDto MapToDto(Court court) => new()
    {
        Id = court.Id,
        ClubId = court.ClubId,
        Name = court.Name,
        SurfaceType = court.SurfaceType,
        IsIndoor = court.IsIndoor,
        PricePerHour = new PriceDto { Amount = court.PricePerHour.Amount, Currency = court.PricePerHour.Currency },
        IsActive = court.IsActive
    };
}