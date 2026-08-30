using Grpc.Core;
using ReservationService.Application.Interfaces;

namespace ReservationService.API.Grpc;

public class ReservationGrpcService : ReservationGrpc.ReservationGrpcBase
{
    private readonly IClubService _clubService;

    public ReservationGrpcService(IClubService clubService)
    {
        _clubService = clubService;
    }

    public override async Task<GetClubsResponse> GetClubs(
        GetClubsRequest request,
        ServerCallContext context)
    {
        var clubs = await _clubService.GetAllClubsAsync();

        var response = new GetClubsResponse();

        foreach (var club in clubs)
        {
            var clubMessage = new ClubMessage
            {
                Id = club.Id.ToString(),
                Name = club.Name,
                IsActive = club.IsActive,
                Address = new AddressMessage
                {
                    City = club.Address.City,
                    Municipality = club.Address.Municipality ?? string.Empty,
                    ZipCode = club.Address.ZipCode ?? string.Empty,
                    Street = club.Address.Street,
                    Country = club.Address.Country,
                    StreetNumber = club.Address.StreetNumber
                }
            };

            foreach (var court in club.Courts)
            {
                clubMessage.Courts.Add(new CourtMessage
                {
                    Id = court.Id.ToString(),
                    ClubId = court.ClubId.ToString(),
                    Name = court.Name,
                    SurfaceType = (int)court.SurfaceType,
                    IsIndoor = court.IsIndoor,
                    PricePerHour = (double)court.PricePerHour.Amount,
                    Currency = court.PricePerHour.Currency,
                    IsActive = court.IsActive
                });
            }

            foreach (var workingHours in club.WorkingHours)
            {
                clubMessage.WorkingHours.Add(new WorkingHoursMessage
                {
                    DayOfWeek = (int)workingHours.DayOfWeek,
                    OpenTime = workingHours.OpenTime.ToString("HH:mm"),
                    CloseTime = workingHours.CloseTime.ToString("HH:mm"),
                    IsClosed = workingHours.IsClosed
                });
            }

            response.Clubs.Add(clubMessage);
        }

        return response;
    }
}