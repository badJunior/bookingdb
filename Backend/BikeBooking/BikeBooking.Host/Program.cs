using BikeBooking.Host;
using BikeBooking.Host.Protos;
using BikeBooking.Host.Services;
using BikeBooking.Services;
using BikeBooking.Services.persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Stripe;
using Stripe.Checkout;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<BikesBookingDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

builder.Services.AddScoped<IBookingService, BookingServices>();
builder.Services.AddScoped<IBikesService, BikesService>();
builder.Services.AddSingleton<IStripeClient>(new StripeClient(builder.Configuration["Stripe:SecretKey"]));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IDeliveryService, DeliveryService>();
builder.Services.AddScoped<ICourierService, CourierService>();
builder.Services.AddScoped<IReceiptService, EmulatedReceiptService>();
builder.Services.AddScoped<IInspectionService, InspectionService>();
builder.Services.AddSingleton<IFileStorage, LocalFileStorage>();
builder.Services.AddMemoryCache();

builder.Services.Configure<DeliveryOptions>(builder.Configuration.GetSection("Delivery"));
builder.Services.Configure<StorageOptions>(builder.Configuration.GetSection("Storage"));

builder.Services.AddHttpClient<IGeocodingService, NominatimGeocodingService>(client =>
{
    client.BaseAddress = new Uri("https://nominatim.openstreetmap.org/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd("BikeBooking/1.0 (bike rental delivery)");
    client.Timeout = TimeSpan.FromSeconds(10);
});

builder.Services.AddHostedService<DeliveryAssignmentBackgroundService>();

// Настройка Swagger с поддержкой JWT и ролей
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Введите токен в формате: Bearer ваш_токен",
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddOpenApi();

// Игнорировать регистр букв в JSON
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
});

builder.Services.AddCors((options) => options.AddDefaultPolicy((builder) =>
    builder.WithOrigins([
        "http://localhost:8080",
        "http://localhost:80",
        "http://localhost",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ])
           .AllowAnyHeader()
           .AllowAnyMethod()));

builder.Services.AddGrpc();
builder.Services.AddScoped<AuthGrpcService>();

var secretKey = "my_super_secret_key_for_jwt_at_least_32_characters";
var key = Encoding.ASCII.GetBytes(secretKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        // Browsers cannot attach an Authorization header to <img> requests,
        // so photo files accept a short-lived query token.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (context.Request.Path.StartsWithSegments("/photos"))
                {
                    var token = context.Request.Query["access_token"];
                    if (!string.IsNullOrEmpty(token))
                        context.Token = token;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("User", policy =>
        policy.RequireClaim(ClaimTypes.Role, "User", "Admin"));

    options.AddPolicy("Admin", policy =>
        policy.RequireClaim(ClaimTypes.Role, "Admin"));

    options.AddPolicy("Courier", policy =>
        policy.RequireClaim(ClaimTypes.Role, "Courier"));

    options.AddPolicy("Authenticated", policy =>
        policy.RequireClaim(ClaimTypes.Role, "User", "Admin", "Courier"));
});
var app = builder.Build();

app.MapOpenApi();
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.RegisterBookingRoutes();
app.RegisterBookingLifecycleRoutes();
app.RegisterCategoriesRoutes();
app.RegisterModelsRoutes();
app.RegisterBikeRoutes();
app.RegisterCourierRoutes();
app.RegisterDeliveryRoutes();
app.RegisterAddressRoutes();

app.MapGrpcService<AuthGrpcService>();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<BikesBookingDbContext>();
    dbContext.Database.Migrate();
    await CatalogSeeder.SeedAsync(dbContext);
}

app.MapPost("/auth/register", async (RegisterRequest request, AuthGrpcService grpcService) =>
{
    var response = await grpcService.Register(request);
    return Results.Ok(response);
});

app.MapPost("/auth/login", async (LoginRequest request, BikesBookingDbContext dbContext) =>
{
    var user = await dbContext.Users
        .Include(u => u.Courier)
        .FirstOrDefaultAsync(u => u.Email == request.Email);
    if (user == null)
    {
        return Results.Unauthorized();
    }

    bool passwordIsValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
    if (!passwordIsValid)
    {
        return Results.Unauthorized();
    }

    var tokenHandler = new JwtSecurityTokenHandler();
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        ]),
        Expires = DateTime.UtcNow.AddHours(2),
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
    };

    var token = tokenHandler.CreateToken(tokenDescriptor);
    var tokenString = tokenHandler.WriteToken(token);

    return Results.Ok(new
    {
        token = tokenString,
        userId = user.Id,
        username = user.Username,
        role = user.Role.ToString(),
        courierApproved = user.Courier?.IsApproved ?? false
    });
});


app.Run();