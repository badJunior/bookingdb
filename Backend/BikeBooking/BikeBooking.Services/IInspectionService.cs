using BikeBooking.Logic;

namespace BikeBooking.Services
{
    public interface IInspectionService
    {
        Task<BookingInspectionsDto> Get(int bookingId, int userId, UserRole role, CancellationToken cancellationToken = default);

        Task<InspectionPhotoDto> Upload(
            int bookingId,
            InspectionPhase phase,
            int userId,
            Stream content,
            long length,
            CancellationToken cancellationToken = default);

        Task DeletePhoto(int bookingId, InspectionPhase phase, int photoId, int userId, CancellationToken cancellationToken = default);

        Task<InspectionDto> Submit(
            int bookingId,
            InspectionPhase phase,
            int userId,
            string? note,
            CancellationToken cancellationToken = default);

        Task<(Stream Stream, string ContentType)> GetPhotoFile(
            int photoId,
            int userId,
            UserRole role,
            CancellationToken cancellationToken = default);
    }

    public record InspectionPhotoDto(
        int Id,
        string Url,
        string ContentType,
        long SizeBytes,
        int SortOrder,
        DateTime CreatedAt
    );

    public record InspectionDto(
        int Id,
        string Phase,
        string? Note,
        DateTime CreatedAt,
        InspectionPhotoDto[] Photos
    );

    public record BookingInspectionsDto(
        int BookingId,
        string BookingStatus,
        InspectionDto? Handover,
        InspectionDto? Return
    );
}
