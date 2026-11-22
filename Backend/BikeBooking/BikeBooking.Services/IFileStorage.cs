namespace BikeBooking.Services
{
    public interface IFileStorage
    {
        Task SaveAsync(Stream content, string relativePath, CancellationToken cancellationToken = default);

        Task<Stream?> OpenReadAsync(string relativePath, CancellationToken cancellationToken = default);

        Task DeleteAsync(string relativePath, CancellationToken cancellationToken = default);
    }
}
