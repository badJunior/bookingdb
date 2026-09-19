using BikeBooking.Logic;
using BikeBooking.Services;
using BikeBooking.Services.persistence;
using Stripe;
using Stripe.Checkout;

namespace BikeBooking.Host
{
    public static class BookingRoutesExtensions
    {

        public static void RegisterBookingRoutes(this WebApplication app)
        {
            var group = app.MapGroup("/booking");
            group.MapPost("/available-bikes", async (GetAvailableBikesRequest request, IBookingService bookingService) =>
            {

                var bikesList = await bookingService.GetAvailableBikes(request.StartDate, request.EndDate);

                return Results.Ok(new GetAvailableBikesResponse(
                    bikesList.Select(bikeDto => new AvailableBike(
                        bikeDto.id,
                        bikeDto.model,
                        bikeDto.availability,
                        bikeDto.year,
                        bikeDto.category,
                        bikeDto.power,
                        bikeDto.price
                    )).ToArray()
                ));
            }).Produces<GetAvailableBikesResponse>();
            group.MapPost("/bookings", async (CreateBookingRequest request, IBookingService bookingService) =>
            {
                var serviceDto = new CreateBookingServiceDto(
                    request.BikeId,
                    request.StartDate,
                    request.EndDate,
                    request.ClientName,
                    request.PaymentType,
                    request.StripePaymentIntentId

                );

                var bookingResult = await bookingService.CreateBooking(serviceDto);

                return Results.Ok(new CreateBookingResponseDto(
                    bookingResult.Id,
                    bookingResult.BikeId,
                    bookingResult.StartDate,
                    bookingResult.EndDate,
                    bookingResult.ClientName,
                    bookingResult.TotalPrice,
                    bookingResult.PaymentDate,
                    bookingResult.PaymentType
                ));
            }).Produces<CreateBookingResponseDto>(200).RequireAuthorization("User");

            app.MapPost("/create-checkout-session", async (CreateCheckoutRequest request, IStripeClient stripeClient) =>
            {
                var options = new SessionCreateOptions
                {
                    PaymentMethodTypes = new List<string> { "card" },
                    LineItems = new List<SessionLineItemOptions>
        {
            new SessionLineItemOptions
            {
                PriceData = new SessionLineItemPriceDataOptions
                {
                    UnitAmount = (long)request.TotalPrice,
                    Currency = "usd",
                    ProductData = new SessionLineItemPriceDataProductDataOptions
                    {
                        Name = "Аренда мотоцикла",
                    },
                },
                Quantity = 1,
            },
        },
                    Mode = "payment",
                    SuccessUrl = "http://localhost:5173/booking/available-bikes",
                    CancelUrl = "http://localhost:5173/booking/bookings",
                    Metadata = new Dictionary<string, string>
        {
            { "booking_id", request.BookingId.ToString() }
        },
                };
                var service = new SessionService(stripeClient);
                var session = await service.CreateAsync(options);

                return Results.Ok(new { url = session.Url });
            });




        }


        public static void RegisterCategoriesRoutes(this WebApplication app)
        {
            var group = app.MapGroup("/categories");

            group.MapGet("/", async (IBikesService bikesService) =>
            {
                var categoriesList = await bikesService.GetCategories();
                return Results.Ok(new GetAllCategoriesResponse(categoriesList.Select((СategoriesBikesDto categoryDto) => new AllCategory(categoryDto.id, categoryDto.name)).ToArray()));
            }).Produces<GetAllCategoriesResponse>();

            group.MapPost("/", async (CreateCategoryRequest request, IBikesService bikesService) =>
            {
                await bikesService.CreateCategory(new CreateCategoryDto(request.Name));
                return Results.Ok(new CreateCategoryResponse());
            }).Produces<CreateCategoryResponse>().RequireAuthorization("Admin");
        }
        public static void RegisterModelsRoutes(this WebApplication app)
        {
            var group = app.MapGroup("/models");
            group.MapGet("/", async (IBikesService bikesService) =>
            {
                var modelsList = await bikesService.GetModels();
                return Results.Ok(new GetModelsResponse(modelsList.Select((ModelsBikesDto modelDto) => new AllModels(modelDto.id, modelDto.power, modelDto.startYear, modelDto.endYear, modelDto.name, modelDto.categoryId, modelDto.categoryName)).ToArray()));
            });
            group.MapPost("/", async (CreateModelRequest request, IBikesService bikesService) =>
            {
                await bikesService.CreateModel(new CreateModelDto(request.Power, request.StartYear, request.EndYear, request.Name, request.CategoryId));
                return Results.Ok(new CreateModelResponse());
            }).Produces<CreateModelResponse>().RequireAuthorization("Admin"); ;

        }
        public static void RegisterBikeRoutes(this WebApplication app)
        {
            var group = app.MapGroup("/bikes");
            group.MapPost("/", async (CreateBikeRequest request, IBikesService bikesService) =>
            {
                await bikesService.CreateBike(new CreateBikeDto(request.ModelId, request.Year, request.Price));
                return Results.Ok(new CreateCategoryResponse());
            }).Produces<CreateCategoryResponse>().RequireAuthorization("Admin");
            group.MapGet("/", async (IBikesService bikesService) =>
            {
                var bikesList = await bikesService.GetBikes();
                return Results.Ok(new GetAllBikesResponse(bikesList.Select((BikesDto bikesDto) => new AllBike(bikesDto.Id, bikesDto.Model, bikesDto.Year, bikesDto.Category, bikesDto.Power, bikesDto.Price)).ToArray()));
            }).Produces<GetAllBikesResponse>();


        }

    }

    public record GetAvailableBikesRequest(DateTime? StartDate, DateTime? EndDate);
    public record GetAvailableBikesResponse(AvailableBike[] AvailableBikes);
    public record AvailableBike(int Id, string Model, bool Availability, int Year, string Category, int Power, int price);
    public record GetAllCategoriesRequest();
    public record GetAllCategoriesResponse(AllCategory[] AllCategories);
    public record AllCategory(int Id, string Name);
    public record CreateCategoryRequest(string Name);
    public record CreateCategoryResponse();
    public record GetModelsRequest();
    public record GetModelsResponse(AllModels[] AllModels);
    public record AllModels(int Id, int Power, int StartYear, int? EndYear, string Name, int CategoryId, string CategoryName);
    public record CreateModelRequest(int Power, int StartYear, int? EndYear, string Name, int CategoryId);
    public record CreateModelResponse();
    public record CreateBikeRequest(int ModelId, int Year, int Price);
    public record CreayeBikeRespoonse();
}
public record GetAllBikesRequest();
public record GetAllBikesResponse(AllBike[] AllBikes);
public record AllBike(int Id, string Model, int Year, string Category, int Power, int price);
public record UpdateBike(int Id, bool Availability);
public record UpdateAllBikesResponse();
public record UpdateAllBikesRequest(UpdateBike[] UpdateBikes);
public record LoginRequest(string Email, string Password);


public record CreateBookingRequest(
    int BikeId,
    DateTime StartDate,
    DateTime EndDate,
    string ClientName,
    string PaymentType,
    string? StripePaymentIntentId
);


public record CreateCheckoutRequest(
       int BikeId,
       DateTime StartDate,
       DateTime EndDate,
       string ClientName,
       decimal TotalPrice,
       int BookingId
   );
