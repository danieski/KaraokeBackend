
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using KaraokeBackend.Services;
using KaraokeBackend.Models;
using System.Net.Http.Json;
using System.Net;

namespace KaraokeBackend.Controllers
{
    [Route("api/karaoke")]
    [ApiController]
    public class KaraokeController : ControllerBase
    {
    private readonly IConfiguration _config;
    private readonly KaraokeBackend.Services.IQueueService _queueService;
    private readonly IHttpClientFactory _httpFactory;

        public KaraokeController(IConfiguration config, KaraokeBackend.Services.IQueueService queueService, IHttpClientFactory httpFactory)
        {
            _config = config;
            _queueService = queueService; // usamos la interfaz compartida
            _httpFactory = httpFactory;
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search(string q)
        {
            //Obtengo la api de youtube no se como de la config
            var apiKey = _config["Youtube:ApiKey"];
            //El usuario me ha pasado la query
            var query = $"{q} karaoke";
    
            var url = $"https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q={query}&key={apiKey}";

            var client = _httpFactory.CreateClient();
            try
            {
                var result = await client.GetFromJsonAsync<object>(url);
                return Ok(result);
            }
            //Tratamos de caputurar error 403 que significa que la api key ha llegado al limite
            catch (HttpRequestException ex)
            {
                // Si hay un error, cambia de api key 
                if (ex.StatusCode == HttpStatusCode.Forbidden)
                {
                    if (apiKey == _config["Youtube:ApiKey"])
                        apiKey = _config["Youtube:ApiKeyBackup"];
                    else
                        apiKey = _config["Youtube:ApiKey"];

                    Console.WriteLine($"Error al llamar a la API de YouTube: {ex.StatusCode} - {ex.Message}");
                    Console.WriteLine($"Cambiando a API: {apiKey}");
                }
                else
                {
                    Console.WriteLine($"Error al llamar a la API de YouTube: {ex.Message}");
                }
                // Reintentar con la otra API key
                url = $"https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q={query}&key={apiKey}";
                var result = await client.GetFromJsonAsync<object>(url);
                return Ok(result);
            }
            
            
        }

        [HttpPost("queue")]
        public IActionResult AddToQueue(QueueItem item)
        {
            _queueService.Add(item);
            return Ok(new { success = true, item = item });
        }

        [HttpGet("queue")]
        public IActionResult GetQueue()
        {
            var items = _queueService.GetPending().ToList();
            return Ok(items);
        }

        [HttpPost("queue/next")]
        public IActionResult NextSong()
        {
            _queueService.MarkNextPlayed();
            return Ok(new { success = true });
        }
    }
}
