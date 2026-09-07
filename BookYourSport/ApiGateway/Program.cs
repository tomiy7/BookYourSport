var builder = WebApplication.CreateBuilder(args);


// ==================================================
// CORS
// ==================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:3000"
                )
                .AllowAnyMethod()
                .AllowAnyHeader();
        }
    );
});


// ==================================================
// REVERSE PROXY
// ==================================================

builder.Services
    .AddReverseProxy()
    .LoadFromConfig(
        builder.Configuration.GetSection(
            "ReverseProxy"
        )
    );


var app = builder.Build();


// ==================================================
// CORS
// ==================================================

app.UseCors(
    "AllowFrontend"
);


// ==================================================
// API GATEWAY / REVERSE PROXY
// ==================================================

app.MapReverseProxy();


app.Run();