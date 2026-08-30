using SearchService.Application.DTOs;
using SearchService.Domain.Enums;

namespace SearchService.Tests.Application.TestData;

public static class ClubTestData
{
    public static ReservationClubDto CreateClub(
        string name,
        string city = "Beograd",
        string street = "Gajeva",
        string streetNumber = "10",
        bool isActive = true)
    {
        return new ReservationClubDto
        {
            Id = Guid.NewGuid(),
            Name = name,
            IsActive = isActive,
            Address = new ReservationAddressDto
            {
                Country = "Serbia",
                City = city,
                Street = street,
                StreetNumber = streetNumber
            },
            Courts = new List<ReservationCourtDto>
            {
                CreateCourt(SurfaceType.Hard)
            }
        };
    }

    public static ReservationCourtDto CreateCourt(
        SurfaceType surfaceType,
        bool isIndoor = false,
        decimal price = 1500,
        bool isActive = true)
    {
        return new ReservationCourtDto
        {
            Id = Guid.NewGuid(),
            Name = "Teren",
            IsActive = isActive,
            SurfaceType = surfaceType,
            IsIndoor = isIndoor,
            PricePerHour = new ReservationPriceDto
            {
                Amount = price,
                Currency = "RSD"
            }
        };
    }
}