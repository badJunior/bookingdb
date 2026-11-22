using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BikeBooking.Services.persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBikeImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Bikes",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Bikes");
        }
    }
}
