using BikeBooking.Logic;
using BikeBooking.Services.persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BikeBooking.Services
{
    /// <summary>
    /// Periodically assigns due deliveries to the nearest free courier,
    /// expires overdue deliveries and marks stale couriers as offline.
    /// </summary>
    public class DeliveryAssignmentBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly DeliveryOptions _options;
        private readonly ILogger<DeliveryAssignmentBackgroundService> _logger;

        public DeliveryAssignmentBackgroundService(
            IServiceScopeFactory scopeFactory,
            IOptions<DeliveryOptions> options,
            ILogger<DeliveryAssignmentBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _options = options.Value;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await RunOnce(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Delivery assignment iteration failed");
                }

                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(_options.AssignmentRetrySeconds), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }

        private async Task RunOnce(CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;

            using (var scope = _scopeFactory.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<BikesBookingDbContext>();

                var staleSince = now.AddMinutes(-_options.CourierOfflineMinutes);

                await db.Couriers
                    .Where(c => c.IsApproved
                        && c.Status == CourierStatus.Available
                        && (c.LastLocationAt == null || c.LastLocationAt < staleSince))
                    .ExecuteUpdateAsync(
                        setters => setters.SetProperty(c => c.Status, CourierStatus.Offline),
                        cancellationToken);

                await db.Deliveries
                    .Where(d => d.Status == DeliveryStatus.Pending && d.ScheduledTo < now)
                    .ExecuteUpdateAsync(
                        setters => setters
                            .SetProperty(d => d.Status, DeliveryStatus.Failed)
                            .SetProperty(d => d.CompletedAt, now),
                        cancellationToken);
            }

            int[] dueIds;
            using (var scope = _scopeFactory.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<BikesBookingDbContext>();
                var assignBefore = now.AddMinutes(_options.AssignmentLeadMinutes);

                dueIds = await db.Deliveries
                    .Where(d => d.Status == DeliveryStatus.Pending && d.ScheduledFrom <= assignBefore)
                    .OrderBy(d => d.ScheduledFrom)
                    .Select(d => d.Id)
                    .Take(50)
                    .ToArrayAsync(cancellationToken);
            }

            foreach (var deliveryId in dueIds)
            {
                using var scope = _scopeFactory.CreateScope();
                var deliveryService = scope.ServiceProvider.GetRequiredService<IDeliveryService>();

                try
                {
                    await deliveryService.TryAssign(deliveryId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not assign delivery {DeliveryId}", deliveryId);
                }
            }
        }
    }
}
