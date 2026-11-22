using BikeBooking.Logic;

namespace BikeBooking.Services
{
    public interface ICourierService
    {
        Task<CourierDto> Register(RegisterCourierDto request);

        Task<CourierDto[]> GetAll();

        Task<CourierDto> Approve(int courierId);

        Task Reject(int courierId);

        Task<CourierDto> UpdateLocation(int userId, double latitude, double longitude);

        Task<CourierDto> UpdateStatus(int userId, CourierStatus status);

        Task<CourierDto?> GetMe(int userId);

        Task<bool> IsApproved(int userId);
    }

    public record RegisterCourierDto(
        string Username,
        string Email,
        string Phone,
        string Password
    );

    public record CourierDto(
        int Id,
        int UserId,
        string Username,
        string Email,
        string Phone,
        bool IsApproved,
        string Status,
        double? Latitude,
        double? Longitude,
        DateTime? LastLocationAt
    );
}
