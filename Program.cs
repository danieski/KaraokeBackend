using KaraokeBackend.Services;
using Microsoft.OpenApi.Models;
var builder = WebApplication.CreateBuilder(args);

// ✅ Añadir servicios MVC
builder.Services.AddControllers();

// Registrar cola: usamos la interfaz para desacoplar
builder.Services.AddSingleton<KaraokeBackend.Services.IQueueService, KaraokeBackend.Services.QueueService>();

// Registrar HttpClient factory para consultas externas (YouTube)
builder.Services.AddHttpClient();

// Habilitar CORS para el frontend
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ✅ Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();

// Habilitar CORS y archivos estáticos
app.UseCors();
app.UseDefaultFiles();
app.UseStaticFiles();

// ✅ Mapea controladores
app.MapControllers();

app.Run();
