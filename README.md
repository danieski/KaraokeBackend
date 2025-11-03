## KaraokeBackend

Aplicación pequeña en ASP.NET Core para manejar una cola de canciones (karaoke) usando SQLite y Dapper.

Contenido
- `Controllers/KaraokeControlle.cs` - Controlador HTTP con endpoints para búsqueda (YouTube) y la cola.
- `Service/QueueService.cs` - Servicio que implementa la lógica de persistencia en SQLite.
- `Services/IQueueService.cs` - Interfaz para desacoplar el controlador del servicio concreto.
- `Models/QueueItem.cs` - Modelo de un item de la cola.
- `Program.cs` - Configuración de la app y DI.

Requisitos
- .NET 9 SDK
- Dependencias (ya en el proyecto): Dapper, Microsoft.Data.Sqlite

Configuración
- La aplicación lee la clave de YouTube desde la configuración (appsettings.json):

```json
{
  "Youtube": {
    "ApiKey": "TU_API_KEY_AQUI"
  },
  "Queue": {
    "ConnectionString": "Data Source=queue.db"
  }
}
```

Si `Queue:ConnectionString` no está presente, la aplicación utiliza `Data Source=queue.db` por defecto (archivo `queue.db` en el directorio de la app).

Endpoints

- GET /api/karaoke/search?q={query}
  - Busca en la API de YouTube (requiere `Youtube:ApiKey`).
  - Respuesta: JSON con los resultados devueltos por la API de YouTube.

- POST /api/karaoke/queue
  - Añade un `QueueItem` a la cola.
  - Body (application/json):
    ```json
    {
      "videoId": "id_del_video",
      "title": "Nombre de la canción",
      "user": "NombreUsuario"
    }
    ```
  - Respuesta: { "success": true, "item": { ... } }

- GET /api/karaoke/queue
  - Devuelve la lista de items con `Status='pending'`.
  - Respuesta: arreglo de `QueueItem`.

- POST /api/karaoke/queue/next
  - Marca la siguiente canción pendiente como `played`.
  - Respuesta: { "success": true }

Cómo compilar y ejecutar (PowerShell)

1. Restaurar y compilar:
```powershell
dotnet build "C:\Users\dani\Documents\Github\KaraokeBackend\KaraokeBackend.csproj"
```

2. Ejecutar:
```powershell
dotnet run --project "C:\Users\dani\Documents\Github\KaraokeBackend\KaraokeBackend.csproj"
```

La aplicación mostrará en la consola la URL donde está escuchando (por ejemplo http://localhost:5172). También está habilitado Swagger en entorno de desarrollo en `/swagger`.

Probar con PowerShell (ejemplos)

- POST añadir a la cola:
```powershell
$body = @{ videoId='test123'; title='Test Song'; user='TestUser' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:5172/api/karaoke/queue -Body $body -ContentType 'application/json'
```

- GET obtener la cola:
```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:5172/api/karaoke/queue
```

Notas de desarrollo

- El servicio de cola ahora implementa `IQueueService` y se registra en DI en `Program.cs`.
- `IHttpClientFactory` se usa para crear `HttpClient` seguro en el controlador (para la llamada a YouTube).
- Si ves advertencias sobre propiedades no-nullable en `QueueItem` (VideoId/Title/User), tienes opciones:
  - Añadir `required` a las propiedades en `QueueItem` (C# 11+).
  - Declarar las propiedades como `string?` si aceptas nulls.
  - Validar el modelo en el controlador con `[Required]` y atributos de validación.

Problemas comunes y soluciones

- Archivo `KaraokeBackend.exe` bloqueado al compilar:
  - Si la app sigue ejecutándose y el build falla porque el .exe está en uso, mata el proceso (ejemplo):
    ```powershell
    # Busca procesos por nombre y termina (ajusta si el nombre es distinto)
    Get-Process -Name KaraokeBackend -ErrorAction SilentlyContinue | Stop-Process -Force
    ```
  - Alternativamente, reinicia VS Code o el terminal que está ejecutando la app.

- `queue.db` no aparece o la cola parece vacía:
  - Verifica `Queue:ConnectionString` en `appsettings.json` o busca `queue.db` en el directorio de la app.
  - Asegúrate de enviar `Content-Type: application/json` en los POST.

Mejoras sugeridas

- Convertir `QueueService` a métodos async (ExecuteAsync/QueryAsync) para mejor escalabilidad.
- Añadir validación de entrada (`[Required]`) para `QueueItem` y devolver `BadRequest` cuando falten campos.
- Añadir tests unitarios para el servicio (usar una base de datos en memoria o un archivo temporal durante las pruebas).

Contacto

Si quieres que aplique alguna de las mejoras sugeridas (async, validación, renombrar archivo controlador, tests), dímelo y lo hago.

---
Generado automáticamente: documentación básica del proyecto.
