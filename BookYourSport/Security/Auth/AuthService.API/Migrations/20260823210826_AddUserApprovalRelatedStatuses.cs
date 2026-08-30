using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AuthService.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUserApprovalRelatedStatuses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Users_Status",
                table: "users");

            migrationBuilder.DropColumn(
                name: "status",
                table: "users");

            migrationBuilder.AddColumn<string>(
                name: "approval_status",
                table: "users",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "not_requested");

            migrationBuilder.AddColumn<string>(
                name: "contract_status",
                table: "users",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "not_generated");

            migrationBuilder.AddColumn<string>(
                name: "subscription_status",
                table: "users",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "not_started");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Users_ApprovalStatus",
                table: "users",
                sql: "approval_status IN ('not_requested', 'pending', 'approved', 'rejected')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Users_ContractStatus",
                table: "users",
                sql: "contract_status IN ('not_generated', 'generated', 'signed')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Users_SubscriptionStatus",
                table: "users",
                sql: "subscription_status IN ('not_started', 'pending', 'paid', 'failed')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Users_ApprovalStatus",
                table: "users");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Users_ContractStatus",
                table: "users");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Users_SubscriptionStatus",
                table: "users");

            migrationBuilder.DropColumn(
                name: "approval_status",
                table: "users");

            migrationBuilder.DropColumn(
                name: "contract_status",
                table: "users");

            migrationBuilder.DropColumn(
                name: "subscription_status",
                table: "users");

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
                sql: "status IN ('', 'pending', 'approved')");
        }
    }
}