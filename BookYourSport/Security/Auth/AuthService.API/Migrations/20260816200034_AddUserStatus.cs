using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AuthService.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUserStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "status",
                table: "users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Users_Status",
                table: "users",
                sql: "status IN ('pending', 'approved')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Users_Status",
                table: "users");

            migrationBuilder.DropColumn(
                name: "status",
                table: "users");
        }
    }
}
