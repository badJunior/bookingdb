using Microsoft.EntityFrameworkCore.Migrations;
using System.Data;
using static System.Net.Mime.MediaTypeNames;

#nullable disable

namespace BikeBooking.Services.persistence.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceRoleWithBool : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Удаляем старую строковую колонку
            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");

            // Создаём новую булевую колонку
            migrationBuilder.AddColumn<bool>(
                name: "Role",
                table: "Users",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Откат: удаляем булевую колонку и возвращаем строковую
            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "Users",
                nullable: false,
                defaultValue: "");
        }
    }
}
