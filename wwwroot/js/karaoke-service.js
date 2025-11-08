// Funciones compartidas para ambas interfaces
class KaraokeService {
    static async searchVideos(query) {
        try {
            const response = await fetch(`/api/karaoke/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || 'Error en la búsqueda');
            }
            
            return data.items || [];
        } catch (error) {
            throw new Error('Error al buscar videos');
        }
    }

    static async addToQueue(videoId, title, user = 'Usuario') {
        try {
            const response = await fetch('/api/karaoke/queue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ videoId, title, user })
            });

            if (!response.ok) throw new Error('Error al añadir a la cola');
            return await response.json();
        } catch (error) {
            throw new Error('Error al añadir a la cola');
        }
    }

    static async getQueue() {
        try {
            const response = await fetch('/api/karaoke/queue');
            return await response.json();
        } catch (error) {
            throw new Error('Error al obtener la cola');
        }
    }

    static async markNextPlayed() {
        try {
            await fetch('/api/karaoke/queue/next', { method: 'POST' });
            return await this.getQueue();
        } catch (error) {
            throw new Error('Error al marcar como reproducido');
        }
    }
}

// Función auxiliar para mostrar errores
function showError(message, duration = 5000) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, duration);
    }
}