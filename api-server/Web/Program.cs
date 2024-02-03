using CS.Core;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.OpenApi.Models;
using NodaTime;
using NodaTime.Serialization.JsonNet;
using DotEnv.Core;

var envVars = new EnvLoader().AddEnvFile("../api-server/.env").Load();

/*
 *
 * --- Service Configuration ---
 *
 */

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("_allowedOrigins", policy => 
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials(); // Only if you need credentials (cookies, HTTP authentication) to be sent
    });
});

builder.Services.AddHttpContextAccessor();

// Add session services
builder.Services.AddSession(options =>
{
    options.Cookie.Name = ".HubReview.Session";
    options.IdleTimeout = TimeSpan.FromMinutes(60); // Set the desired timeout
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});


builder.Services.AddControllersWithViews()
    .AddNewtonsoftJson(o => o.SerializerSettings.ConfigureForNodaTime(DateTimeZoneProviders.Tzdb));

builder.Services.Configure<RouteOptions>(o =>
{
    o.LowercaseUrls = true;
    o.LowercaseQueryStrings = true;
});

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.Cookie.Name = "hubreviewsess";
        o.Cookie.HttpOnly = true;
        o.ExpireTimeSpan = TimeSpan.FromMinutes(60);
        o.SlidingExpiration = true;
        o.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
        o.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
    });

builder.Configuration.AddCoreConfiguration();
var coreConfiguration = builder.Services.AddCoreConfigurationInstance(builder.Configuration);
builder.Services.AddCoreProjectServices(coreConfiguration);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "HubReview API",
        Version = "v1"
    });
});
builder.Services.AddSwaggerGenNewtonsoftSupport();
builder.Services.AddHttpClient();

builder.Services.AddSingleton<IEnvReader, EnvReader>();

/*
 *
 * --- App Configuration ---
 *
 */

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("v1/swagger.json", "HubReview API v1");
    });
}

app.UseStaticFiles();
app.UseRouting();

app.UseCors("_allowedOrigins");
app.UseSession();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html"); ;

app.Run();

