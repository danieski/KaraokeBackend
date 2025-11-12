let lastQuery = '';

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search');
    const searchButton = document.getElementById('searchButton');

    // Buscar al presionar el botón
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query.length < 2) {
            document.getElementById('searchResults').innerHTML = '';
            return;
        }

        if (query !== lastQuery) {
            lastQuery = query;
            searchVideos(query);
        }
    });

    // Buscar también al presionar Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchButton.click();
        }
    });

    // Iniciar actualización periódica de la cola
    updateQueue();
    setInterval(updateQueue, 10000);
});

// Buscar videos
async function searchVideos(query) {
    try {
        document.getElementById('searchResults').innerHTML = '<div class="loading">Buscando...</div>';
        const results = await KaraokeService.searchVideos(query);
        
        document.getElementById('searchResults').innerHTML = results.map(item => `
            <div class="video-item">
                <img src="${item.snippet.thumbnails.medium.url}" alt="${item.snippet.title}">
                <div class="video-info">
                    <div class="video-title">${item.snippet.title}</div>
                    <button class="add-button" onclick="addToQueue('${item.id.videoId}', '${encodeURIComponent(item.snippet.title)}')">
                        Añadir a la cola
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showError(error.message);
    }
}

// Añadir a la cola
async function addToQueue(videoId, title) {
    try {
        await KaraokeService.addToQueue(videoId, decodeURIComponent(title));

        // Mostrar mensaje de agradecimiento
        showMessage('🎵 ¡Gracias por poner la canción! Se ha añadido a la cola. Por favor, sea paciente.');

        // Esperar unos segundos antes de salir
        setTimeout(() => {
            window.location.href = 'end.html'; // 👉 Cambia por la página que quieras
        }, 3000); // espera 3 segundos

        updateQueue();
    } catch (error) {
        showError(error.message);
    }
}

function showMessage(text, duration = 3000) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message success';
    messageDiv.textContent = text;
    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, duration);
}

// Actualizar la cola
async function updateQueue() {
    try {
        const queue = await KaraokeService.getQueue();
        const queueDiv = document.getElementById('queue');
        
        document.getElementById('queueCount').textContent = queue.length;
        
        queueDiv.innerHTML = queue.map((item, index) => `
            <div class="queue-item">
                <img src="https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg" alt="${item.title}">
                <div class="video-info">
                    <div class="video-title">
                        ${index + 1}. ${item.title}
                    </div>
                    <div class="video-user">
                        Añadido por: ${item.user}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showError(error.message);
    }
}