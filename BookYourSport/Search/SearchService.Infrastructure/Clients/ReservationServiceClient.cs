using SearchService.Application.DTOs;
using SearchService.Application.Interfaces;
using SearchService.Domain.Enums;
using ReservationService.API.Grpc;

namespace SearchService.Infrastructure.Clients;

public class ReservationServiceClient : IReservationServiceClient
{
    private readonly ReservationGrpc.ReservationGrpcClient _grpcClient;

    public ReservationServiceClient(
        ReservationGrpc.ReservationGrpcClient grpcClient)
    {
        _grpcClient = grpcClient;
    }

    public async Task<List<ReservationClubDto>> GetClubsAsync()
    {
        var response = await _grpcClient.GetClubsAsync(
            new GetClubsRequest());

        return response.Clubs.Select(club => new ReservationClubDto
        {
            Id = Guid.Parse(club.Id),
            Name = club.Name,
            IsActive = club.IsActive,

            Address = new ReservationAddressDto
            {
                City = club.Address.City,
                Municipality = club.Address.Municipality,
                ZipCode = club.Address.ZipCode,
                Street = club.Address.Street,
                Country = club.Address.Country,
                StreetNumber = club.Address.StreetNumber
            },

            Courts = club.Courts.Select(court => new ReservationCourtDto
            {
                Id = Guid.Parse(court.Id),
                ClubId = Guid.Parse(court.ClubId),
                Name = court.Name,
                SurfaceType = (SurfaceType)court.SurfaceType,
                IsIndoor = court.IsIndoor,
                PricePerHour = new ReservationPriceDto
                {
                    Amount = (decimal)court.PricePerHour,
                    Currency = court.Currency
                },
                IsActive = court.IsActive
            }).ToList(),

            WorkingHours = club.WorkingHours.Select(hours =>
                new ReservationWorkingHoursDto
                {
                    DayOfWeek = (DayOfWeek)hours.DayOfWeek,
                    OpenTime = TimeOnly.Parse(hours.OpenTime),
                    CloseTime = TimeOnly.Parse(hours.CloseTime),
                    IsClosed = hours.IsClosed
                }).ToList()

        }).ToList();
    }
}