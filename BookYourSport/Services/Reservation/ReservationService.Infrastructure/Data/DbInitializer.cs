using System.Reflection.Metadata.Ecma335;
using Microsoft.EntityFrameworkCore;
using ReservationService.Domain.Entities;
using ReservationService.Domain.Enums;
using ReservationService.Domain.ValueObjects;

namespace ReservationService.Infrastructure.Data;

public class DbInitializer
{
    public static async Task SeedAsync(ReservationDbContext context)
    {
        if (await context.TennisClubs.AnyAsync()) return;
        
        // In integration testing there will be real UserId used
        var ownerId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        
        var address = Address.Create("Beograd", "Zvezdara", "11050", "Gajeva", "Srbija", "10");

        var club = TennisClub.Create(
            "Teniski klub Zvezdara",
            ownerId,
            "Klub sa 3 terena - sljaka i beton, otvoreni i zatvoreni tereni",
            "+381692345234",
            "info@tkzvezdara.rs",
            address);

        foreach (var day in Enum.GetValues<DayOfWeek>())
        {
            var closeTime = day == DayOfWeek.Sunday ? new TimeOnly(20, 0) : new TimeOnly(22, 0);
            club.SetWorkingHours(day, new TimeOnly(8, 0), closeTime);
        }
        
        club.AddCourt("Teren 1", SurfaceType.Clay, isIndoor: false, Price.Create(1500m));
        club.AddCourt("Teren 2", SurfaceType.Clay, isIndoor: false, Price.Create(1500m));
        club.AddCourt("Teren 3", SurfaceType.Hard, isIndoor: true, Price.Create(2000m));
        
        await context.TennisClubs.AddAsync(club);
        await context.SaveChangesAsync();
    }
}