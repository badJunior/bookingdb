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
    builder.WithOrigins(["http://localhost:8080", "http://localhost:80", "http://localhost", "http://localhost:5173"])
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
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("User", policy =>
        policy.RequireClaim(ClaimTypes.Role, "User", "Admin"));
});
var app = builder.Build();

app.MapOpenApi();
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.RegisterBookingRoutes();
app.RegisterCategoriesRoutes();
app.RegisterModelsRoutes();
app.RegisterBikeRoutes();

app.MapGrpcService<AuthGrpcService>();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<BikesBookingDbContext>();
    dbContext.Database.Migrate();
}

app.MapPost("/auth/register", async (RegisterRequest request, AuthGrpcService grpcService) =>
{
    var response = await grpcService.Register(request);
    return Results.Ok(response);
});

app.MapPost("/auth/login", async (LoginRequest request, BikesBookingDbContext dbContext) =>
{
    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
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
            new Claim(ClaimTypes.Role, user.Role ? "Admin" : "User")
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
        username = user.Username
    });
});
// Webhook для получения уведомлений от Stripe
app.MapPost("/stripe-webhook", async (HttpRequest request) =>
{
    var json = await new StreamReader(request.Body).ReadToEndAsync();
    try
    {
        var stripeEvent = EventUtility.ConstructEvent(
            json,
            request.Headers["Stripe-Signature"],
            builder.Configuration["Stripe:WebhookSecret"]
        );

        if (stripeEvent.Type == "payment_intent.succeeded")
        {
            var paymentIntent = stripeEvent.Data.Object as Stripe.PaymentIntent;
            var bookingId = paymentIntent.Metadata["booking_id"];

            using var scope = app.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<BikesBookingDbContext>();
            var payment = await dbContext.Payments.FirstOrDefaultAsync(p => p.BookingId == int.Parse(bookingId));
            if (payment != null)
            {
                payment.StripePaymentIntentId = paymentIntent.Id;
                await dbContext.SaveChangesAsync();
            }
        }
        return Results.Ok();
    }
    catch (Exception ex)
    {
        // Вместо просто BadRequest, покажи реальный текст ошибки
        Console.WriteLine($"❌ Webhook error: {ex.Message}");
        return Results.BadRequest($"Webhook error: {ex.Message}");
    }
});
app.Run();