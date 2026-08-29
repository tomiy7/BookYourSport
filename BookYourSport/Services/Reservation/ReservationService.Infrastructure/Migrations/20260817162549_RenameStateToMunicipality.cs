using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReservationService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameStateToMunicipality : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "state",
                table: "tennis_clubs",
                newName: "municipality");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "municipality",
                table: "tennis_clubs",
                newName: "state");
        }
    }
}
