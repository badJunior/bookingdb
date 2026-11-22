using System.Security.Cryptography;
using BikeBooking.Logic;
using BikeBooking.Services.persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BikeBooking.Services
{
    public class InspectionService : IInspectionService
    {
        private readonly BikesBookingDbContext _context;
        private readonly IFileStorage _storage;
        private readonly StorageOptions _options;

        public InspectionService(
            BikesBookingDbContext context,
            IFileStorage storage,
            IOptions<StorageOptions> options)
        {
            _context = context;
            _storage = storage;
            _options = options.Value;
        }

        public async Task<BookingInspectionsDto> Get(
            int bookingId,
            int userId,
            UserRole role,
            CancellationToken cancellationToken = default)
        {
            var booking = await LoadBooking(bookingId, cancellationToken);
            await EnsureCanRead(booking, userId, role);

            return MapAll(booking);
        }

        public async Task<InspectionPhotoDto> Upload(
            int bookingId,
            InspectionPhase phase,
            int userId,
            Stream content,
            long length,
            CancellationToken cancellationToken = default)
        {
            if (length <= 0)
                throw new ArgumentException("Файл пустой.");

            if (length > _options.MaxFileBytes)
                throw new ArgumentException($"Файл слишком большой. Максимум {_options.MaxFileBytes / 1024 / 1024} МБ.");

            var booking = await LoadBooking(bookingId, cancellationToken);

            if (booking.UserId != userId)
                throw new UnauthorizedAccessException("Загружать фото может только владелец брони.");

            EnsurePhaseAllowed(booking, phase);

            await using var buffer = new MemoryStream();
            await content.CopyToAsync(buffer, cancellationToken);

            if (buffer.Length > _options.MaxFileBytes)
                throw new ArgumentException($"Файл слишком большой. Максимум {_options.MaxFileBytes / 1024 / 1024} МБ.");

            var bytes = buffer.ToArray();
            var contentType = DetectContentType(bytes)
                ?? throw new ArgumentException("Поддерживаются только JPEG, PNG и WebP.");

            var extension = contentType switch
            {
                "image/png" => ".png",
                "image/webp" => ".webp",
                _ => ".jpg"
            };

            var inspection = booking.Inspections.FirstOrDefault(i => i.Phase == phase);

            if (inspection is null)
            {
                inspection = new BikeInspection
                {
                    BookingId = booking.Id,
                    Phase = phase,
                    CreatedByUserId = userId,
                    CreatedAt = DateTime.UtcNow
                };

                booking.Inspections.Add(inspection);
            }

            if (inspection.Photos.Count >= _options.MaxPhotosPerPhase)
                throw new InvalidOperationException($"Можно загрузить не больше {_options.MaxPhotosPerPhase} фото на этап.");

            var relativePath = $"bookings/{booking.Id}/{phase.ToString().ToLowerInvariant()}/{Guid.NewGuid():N}{extension}";

            await using (var file = new MemoryStream(bytes))
            {
                await _storage.SaveAsync(file, relativePath, cancellationToken);
            }

            var photo = new InspectionPhoto
            {
                Inspection = inspection,
                RelativePath = relativePath,
                ContentType = contentType,
                SizeBytes = bytes.LongLength,
                Sha256 = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant(),
                SortOrder = inspection.Photos.Count == 0 ? 1 : inspection.Photos.Max(p => p.SortOrder) + 1,
                CreatedAt = DateTime.UtcNow
            };

            _context.InspectionPhotos.Add(photo);
            await _context.SaveChangesAsync(cancellationToken);

            return MapPhoto(photo);
        }

        public async Task DeletePhoto(
            int bookingId,
            InspectionPhase phase,
            int photoId,
            int userId,
            CancellationToken cancellationToken = default)
        {
            var booking = await LoadBooking(bookingId, cancellationToken);

            if (booking.UserId != userId)
                throw new UnauthorizedAccessException("Удалять фото может только владелец брони.");

            EnsurePhaseAllowed(booking, phase);

            var inspection = booking.Inspections.FirstOrDefault(i => i.Phase == phase)
                ?? throw new KeyNotFoundException("Фотосессия не найдена.");

            var photo = inspection.Photos.FirstOrDefault(p => p.Id == photoId)
                ?? throw new KeyNotFoundException("Фото не найдено.");

            await _storage.DeleteAsync(photo.RelativePath, cancellationToken);
            _context.InspectionPhotos.Remove(photo);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<InspectionDto> Submit(
            int bookingId,
            InspectionPhase phase,
            int userId,
            string? note,
            CancellationToken cancellationToken = default)
        {
            var booking = await LoadBooking(bookingId, cancellationToken);

            if (booking.UserId != userId)
                throw new UnauthorizedAccessException("Подтвердить фото может только владелец брони.");

            EnsurePhaseAllowed(booking, phase);

            var inspection = booking.Inspections.FirstOrDefault(i => i.Phase == phase)
                ?? throw new InvalidOperationException("Сначала загрузите фото.");

            if (inspection.Photos.Count < _options.MinPhotosPerPhase)
            {
                throw new InvalidOperationException(
                    $"Нужно минимум {_options.MinPhotosPerPhase} фото: спереди, сзади, слева и справа.");
            }

            if (phase == InspectionPhase.Handover)
            {
                var dropoff = booking.Deliveries.FirstOrDefault(d => d.Kind == DeliveryKind.Dropoff);

                if (dropoff is not null && dropoff.Status != DeliveryStatus.Completed)
                    throw new InvalidOperationException("Курьер ещё не передал мотоцикл. Дождитесь завершения доставки.");

                booking.Status = BookingStatus.HandedOver;
                booking.HandedOverAt = DateTime.UtcNow;
            }
            else
            {
                booking.Status = BookingStatus.Completed;
                booking.ReturnedAt = DateTime.UtcNow;
            }

            inspection.Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
            await _context.SaveChangesAsync(cancellationToken);

            return MapInspection(inspection);
        }

        public async Task<(Stream Stream, string ContentType)> GetPhotoFile(
            int photoId,
            int userId,
            UserRole role,
            CancellationToken cancellationToken = default)
        {
            var photo = await _context.InspectionPhotos
                .Include(p => p.Inspection).ThenInclude(i => i.Booking)
                .FirstOrDefaultAsync(p => p.Id == photoId, cancellationToken)
                ?? throw new KeyNotFoundException("Фото не найдено.");

            await EnsureCanRead(photo.Inspection.Booking, userId, role);

            var stream = await _storage.OpenReadAsync(photo.RelativePath, cancellationToken)
                ?? throw new KeyNotFoundException("Файл фото не найден.");

            return (stream, photo.ContentType);
        }

        private async Task<Booking> LoadBooking(int bookingId, CancellationToken cancellationToken)
        {
            return await _context.Bookings
                .Include(b => b.Deliveries)
                .Include(b => b.Inspections).ThenInclude(i => i.Photos)
                .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken)
                ?? throw new KeyNotFoundException($"Booking {bookingId} was not found.");
        }

        private async Task EnsureCanRead(Booking booking, int userId, UserRole role)
        {
            if (role == UserRole.Admin)
                return;

            if (role == UserRole.Courier)
            {
                var courierId = await _context.Couriers
                    .Where(c => c.UserId == userId)
                    .Select(c => (int?)c.Id)
                    .FirstOrDefaultAsync();

                var assigned = courierId is not null
                    && await _context.Deliveries.AnyAsync(d => d.BookingId == booking.Id && d.CourierId == courierId);

                if (!assigned)
                    throw new UnauthorizedAccessException("Эта бронь не назначена вам.");

                return;
            }

            if (booking.UserId != userId)
                throw new UnauthorizedAccessException("Эта бронь принадлежит другому пользователю.");
        }

        private static void EnsurePhaseAllowed(Booking booking, InspectionPhase phase)
        {
            if (phase == InspectionPhase.Handover && booking.Status != BookingStatus.Paid)
                throw new InvalidOperationException("Фото выдачи доступны только после оплаты.");

            if (phase == InspectionPhase.Return && booking.Status != BookingStatus.HandedOver)
                throw new InvalidOperationException("Фото возврата доступны только после получения мотоцикла.");
        }

        private static BookingInspectionsDto MapAll(Booking booking) => new(
            booking.Id,
            booking.Status.ToString(),
            MapInspection(booking.Inspections.FirstOrDefault(i => i.Phase == InspectionPhase.Handover)),
            MapInspection(booking.Inspections.FirstOrDefault(i => i.Phase == InspectionPhase.Return)));

        private static InspectionDto? MapInspection(BikeInspection? inspection)
        {
            if (inspection is null)
                return null;

            return new InspectionDto(
                inspection.Id,
                inspection.Phase.ToString(),
                inspection.Note,
                inspection.CreatedAt,
                inspection.Photos.OrderBy(p => p.SortOrder).Select(MapPhoto).ToArray());
        }

        private static InspectionPhotoDto MapPhoto(InspectionPhoto photo) =>
            new(photo.Id, $"/photos/{photo.Id}/file", photo.ContentType, photo.SizeBytes, photo.SortOrder, photo.CreatedAt);

        private static string? DetectContentType(byte[] bytes)
        {
            if (bytes.Length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF)
                return "image/jpeg";

            if (bytes.Length >= 8
                && bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47)
            {
                return "image/png";
            }

            if (bytes.Length >= 12
                && bytes[0] == (byte)'R' && bytes[1] == (byte)'I'
                && bytes[2] == (byte)'F' && bytes[3] == (byte)'F'
                && bytes[8] == (byte)'W' && bytes[9] == (byte)'E'
                && bytes[10] == (byte)'B' && bytes[11] == (byte)'P')
            {
                return "image/webp";
            }

            return null;
        }
    }
}
