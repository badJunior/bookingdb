using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace BikeBooking.Services
{
    public class LocalFileStorage : IFileStorage
    {
        private readonly string _root;

        public LocalFileStorage(IOptions<StorageOptions> options, IHostEnvironment environment)
        {
            var configuredRoot = options.Value.Root;

            _root = Path.GetFullPath(
                Path.IsPathRooted(configuredRoot)
                    ? configuredRoot
                    : Path.Combine(environment.ContentRootPath, configuredRoot));
        }

        public async Task SaveAsync(Stream content, string relativePath, CancellationToken cancellationToken = default)
        {
            var fullPath = Resolve(relativePath);
            Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

            await using var file = new FileStream(
                fullPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                81920,
                useAsync: true);

            await content.CopyToAsync(file, cancellationToken);
        }

        public Task<Stream?> OpenReadAsync(string relativePath, CancellationToken cancellationToken = default)
        {
            var fullPath = Resolve(relativePath);

            if (!File.Exists(fullPath))
                return Task.FromResult<Stream?>(null);

            Stream stream = new FileStream(
                fullPath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                81920,
                useAsync: true);

            return Task.FromResult<Stream?>(stream);
        }

        public Task DeleteAsync(string relativePath, CancellationToken cancellationToken = default)
        {
            var fullPath = Resolve(relativePath);

            if (File.Exists(fullPath))
                File.Delete(fullPath);

            return Task.CompletedTask;
        }

        private string Resolve(string relativePath)
        {
            var fullPath = Path.GetFullPath(Path.Combine(_root, relativePath));

            if (!fullPath.StartsWith(_root, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Invalid storage path.");

            return fullPath;
        }
    }
}
