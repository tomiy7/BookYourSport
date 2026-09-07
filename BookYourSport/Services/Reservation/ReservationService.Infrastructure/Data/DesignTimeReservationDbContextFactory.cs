using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ReservationService.Infrastructure.Data;

public class DesignTimeReservationDbContextFactory : IDesignTimeDbContextFactory<ReservationDbContext>
{
    public ReservationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ReservationDbContext>();
        optionsBuilder.UseNpgsql(
            "Host=localhost;Port=5435;Database=reservationdb;Username=reservation_user;Password=micamica00");
        
        return new ReservationDbContext(optionsBuilder.Options);
    }
}