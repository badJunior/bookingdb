using BikeBooking.Services;
using System.Security.Cryptography.X509Certificates;

namespace BikeBooking.Host
{
    public static class BookingRoutesExtensions
    {

        public static void RegisterBookingRoutes(this WebApplication app)
        {
            var group = app.MapGroup("/booking");
            group.MapPost("/available-bikes", async (GetAvailableBikesRequest request, IBookingService bookingService) =>
            {
                var bikesList = await bookingService.GetAvailableBikes();
                return Results.Ok(new GetAvailableBikesResponse(bikesList.Select((AvailableBikeDto bikeDto) => new AvailableBike(bikeDto.id, bikeDto.model, bikeDto.availability, bikeDto.year, bikeDto.category, bikeDto.power)).ToArray()));
            });


        }

        public static void RegisterCategoriesRoutes(this WebApplication app)
        {
            var group = app.MapGroup("/categories");

            group.MapGet("/", async (IBikesService bikesService) =>
            {
                var categoriesList = await bikesService.GetCategories();
                return Results.Ok(new GetAllCategoriesResponse(categoriesList.Select((СategoriesBikesDto categoryDto) => new AllCategory(categoryDto.id, categoryDto.name)).ToArray()));
            });

            group.MapPost("/", async (CreateCategoryRequest request, IBikesService bikesService) =>
            {
                await bikesService.CreateCategory(new CreateCategoryDto(request.Name));
                return Results.Ok(new CreateCategoryResponse());
            });
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
                await bikesService.CreateModel(new CreateModelDto(request.Power, request.StartYear, request.EndYear,request.Name, request.CategoryId));
                return Results.Ok(new CreateModelResponse());
            });

        }
        public static void RegisterBikeRoutes(this WebApplication app)
        {
            var group = app.MapGroup("/bike");
            group.MapPost("/", async (CreateBikeRequest request, IBikesService bikesService) =>
            {
                await bikesService.CreateBike(new CreateBikeDto(request.ModelId,request.Year));
                return Results.Ok(new CreateCategoryResponse());
            });
        }
    }

    public record GetAvailableBikesRequest();
    public record GetAvailableBikesResponse(AvailableBike[] AvailableBikes);
    public record AvailableBike(int Id, string Model, bool Availability, int Year, string Category, int Power);
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
    public record CreateBikeRequest(int ModelId,int Year);
    public record CreayeBikeRespoonse();
}

