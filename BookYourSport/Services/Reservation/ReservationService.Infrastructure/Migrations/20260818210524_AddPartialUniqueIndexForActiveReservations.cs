using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReservationService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPartialUniqueIndexForActiveReservations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_reservations_CourtId_StartTime",
                table: "reservations");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "reservations",
                newName: "status");

            migrationBuilder.CreateIndex(
                name: "IX_reservations_CourtId_StartTime",
                table: "reservations",
                columns: new[] { "CourtId", "StartTime" },
                unique: true,
                filter: "status != 'Cancelled'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_reservations_CourtId_StartTime",
                table: "reservations");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "reservations",
                newName: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_reservations_CourtId_StartTime",
                table: "reservations",
                columns: new[] { "CourtId", "StartTime" },
                unique: true);
        }
    }
}
