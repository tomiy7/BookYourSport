using ReservationService.Domain.Entities;
using ReservationService.Domain.Enums;
using ReservationService.Domain.ValueObjects;

namespace ReservationService.Tests.TestHelpers;

public static class TestData
{
    public static Address ValidAddress() =>
        Address.Create("Beograd", "Zemun", "11080", "Cara Dusana", "Serbia", "15");

    public static TennisClub ActiveClub(Guid? ownerId = null)
    {
        var club = TennisClub.Create(
            "Test Klub",
            ownerId ?? Guid.NewGuid(),
            "Opis",
            "011-123456",
            "test@klub.rs",
            ValidAddress());

        foreach (var day in Enum.GetValues<DayOfWeek>())
            club.SetWorkingHours(day, new TimeOnly(7, 0), new TimeOnly(22, 0));

        return club;
    }

    public static Court AddActiveCourt(TennisClub club, string name = "Teren 1", decimal price = 1500m) =>
        club.AddCourt(name, SurfaceType.Clay, isIndoor: false, Price.Create(price));
    
    public static DateTime NextMondayAt(int hour)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var daysUntilMonday = ((int)DayOfWeek.Monday - (int)today.DayOfWeek + 7) % 7;
        daysUntilMonday = daysUntilMonday == 0 ? 7 : daysUntilMonday; // uvek SLEDECI ponedeljak, ne danas
        var monday = today.AddDays(daysUntilMonday);
        return DateTime.SpecifyKind(monday.ToDateTime(new TimeOnly(hour, 0)), DateTimeKind.Utc);
    }
}