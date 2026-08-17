using Microsoft.Extensions.Logging;
using ReservationService.Application.DTOs;
using ReservationService.Application.Interfaces;
using ReservationService.Domain.Entities;
using ReservationService.Domain.Interfaces;
using ReservationService.Domain.ValueObjects;

namespace ReservationService.Application.Services;

public class ClubService : IClubService
{
    private readonly IClubRepository _clubRepository;
    private readonly ILogger<CourtService> _logger;

    public ClubService(IClubRepository clubRepository, ILogger<CourtService> logger)
    {
        _clubRepository = clubRepository;
        _logger = logger;
    }
    
    public async Task<List<ClubDto>> GetAllClubsAsync()
    {
        var clubs = await _clubRepository.GetAllAsync();
        _logger.LogInformation("Retrieved {Count} clubs", clubs.Count());
        return clubs.Select(MapToDto).ToList();
    }

    public async Task<ClubDto?> GetClubByIdAsync(Guid id)
    {
        var club = await _clubRepository.GetByIdAsync(id);
        if (club == null)
            _logger.LogWarning("Club with id {ClubId} was not found", id);
        return club == null ? null : MapToDto(club);
    }

    public async Task<ClubDto> CreateClubAsync(CreateClubDto clubDto)
    {
        var address = Address.Create(clubDto.City, clubDto.State, clubDto.ZipCode, clubDto.Street, clubDto.Country, clubDto.StreetNumber);
        var club = TennisClub.Create(clubDto.Name, clubDto.OwnerId, clubDto.Description, clubDto.PhoneNumber, clubDto.EmailAddress, address);

        if (clubDto.WorkingHours != null)
        {
            foreach (var w in clubDto.WorkingHours)
                club.SetWorkingHours(w.DayOfWeek, w.OpenTime, w.CloseTime, w.IsClosed);
        }
        
        await _clubRepository.AddAsync(club);
        await _clubRepository.SaveChangesAsync();
        
        _logger.LogInformation("Club {ClubId} '{ClubName}' created by owner {OwnerId}", club.Id, club.Name, club.OwnerId);
        return MapToDto(club);
    }

    public async Task<ClubDto?> UpdateClubAsync(Guid id, UpdateClubDto clubDto)
    {
        var club = await _clubRepository.GetByIdAsync(id);
        if (club == null)
        {
            _logger.LogWarning("Attempted to update non-existent club {ClubId}", id);
        }
        
        var address = Address.Create(clubDto.City, clubDto.State, clubDto.ZipCode, clubDto.Street, clubDto.Country, clubDto.StreetNumber);
        club!.UpdateDetails(clubDto.Name, clubDto.Description, clubDto.PhoneNumber, clubDto.EmailAddress, address);
        
        _clubRepository.Update(club);
        await _clubRepository.SaveChangesAsync();
        
        _logger.LogInformation("Club {ClubId} updated", id);
        return MapToDto(club);
    }

    public async Task<bool> DeleteClubAsync(Guid id)
    {
        var club = await _clubRepository.GetByIdAsync(id);
        if (club == null)
        {
            _logger.LogWarning("Attempted to delete non-existent club {ClubId}", id);
            return false;
        }
        
        _clubRepository.Delete(club);
        await _clubRepository.SaveChangesAsync();
        
        _logger.LogInformation("Club {ClubId} deleted", id);
        return true;
    }

    private static ClubDto MapToDto(TennisClub club) => new()
    {
        Id = club.Id,
        Name = club.Name,
        OwnerId = club.OwnerId,
        Description = club.Description,
        PhoneNumber = club.PhoneNumber,
        EmailAddress = club.EmailAddress,
        IsActive = club.IsActive,
        Address = new AddressDto
        {
            City = club.Address.City,
            State = club.Address.State,
            ZipCode = club.Address.ZipCode,
            Street = club.Address.Street,
            Country = club.Address.Country,
            StreetNumber = club.Address.StreetNumber,
        },
        WorkingHours = club.WorkingHours
            .OrderBy(w => w.DayOfWeek)
            .Select(w => new WorkingHoursDto
            {
                Id = w.Id,
                DayOfWeek = w.DayOfWeek,
                OpenTime = w.OpenTime,
                CloseTime = w.CloseTime,
                IsClosed = w.IsClosed
            })
            .ToList(),
        Courts = club.Courts
            .Select(c => new CourtDto
            {
                Id = c.Id,
                ClubId = c.ClubId,
                Name = c.Name,
                SurfaceType = c.SurfaceType,
                IsIndoor = c.IsIndoor,
                PricePerHour = new PriceDto { Amount = c.PricePerHour.Amount, Currency = c.PricePerHour.Currency },
                IsActive = c.IsActive
            })
            .ToList()
    };
}