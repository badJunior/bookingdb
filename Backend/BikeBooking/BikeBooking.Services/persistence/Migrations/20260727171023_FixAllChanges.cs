using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BikeBooking.Services.persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixAllChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Price",
                table: "Bikes",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Price",
                table: "Bikes");
        }
    }
}
