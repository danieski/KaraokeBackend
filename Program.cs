using KaraokeBackend.Services;
using Microsoft.OpenApi.Models;
var builder = WebApplication.CreateBuilder(args);

// ✅ Añadir servicios MVC
builder.Services.AddControllers();

// Registrar cola: usamos la interfaz para desacoplar
builder.Services.AddSingleton<KaraokeBackend.Services.IQueueService, KaraokeBackend.Services.QueueService>();

// Registrar HttpClient factory para consultas externas (YouTube)
builder.Services.AddHttpClient();

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

// ✅ Mapea controladores
app.MapControllers();

app.Run();
