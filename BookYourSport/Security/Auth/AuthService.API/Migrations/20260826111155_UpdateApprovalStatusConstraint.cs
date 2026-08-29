using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AuthService.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateApprovalStatusConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Users_ApprovalStatus",
                table: "users");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Users_ApprovalStatus",
                table: "users",
                sql: "approval_status IN ('not_requested', 'requested', 'approved', 'rejected')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Users_ApprovalStatus",
                table: "users");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Users_ApprovalStatus",
                table: "users",
                sql: "approval_status IN ('not_requested', 'pending', 'approved', 'rejected')");
        }
    }
}
