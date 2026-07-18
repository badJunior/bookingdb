using BikeBooking.Host;
using BikeBooking.Services;
using BikeBooking.Services.persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<BikesBookingDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

builder.Services.AddScoped<IBookingService, BookingServices>();
builder.Services.AddScoped<IBikesService, BikesService>();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();

builder.Services.AddCors((options) => options.AddDefaultPolicy((builder) => builder.WithOrigins(["http://localhost:8080", "http://localhost:80", "http://localhost", "http://localhost:5173"]).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.

app.MapOpenApi();
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();


app.RegisterBookingRoutes();
app.RegisterCategoriesRoutes();
app.RegisterModelsRoutes();
app.RegisterBikeRoutes();


using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<BikesBookingDbContext>();
    dbContext.Database.Migrate();
}

app.Run();

