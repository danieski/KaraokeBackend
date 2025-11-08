let player;
let currentVideoId = null;

// Inicializar el reproductor de YouTube cuando la API esté lista
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '360',
        width: '640',
        videoId: '',
        playerVars: {
            'playsinline': 1,
            'enablejsapi': 1,
            'origin': window.location.origin,
            'autoplay': 0,
            'rel': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    console.log('Player ready');
    // Intentar cargar la cola actual cuando el reproductor esté listo
    updateQueue();
}

function onPlayerError(event) {
    console.error('Player error:', event.data);
    // Códigos de error comunes:
    // 2 - La solicitud contiene un parámetro no válido
    // 5 - El contenido solicitado no puede ser reproducido
    // 100 - El video solicitado no se encuentra
    // 101/150 - El propietario del video no permite que se reproduzca en reproductores insertados
    
    let errorMessage = 'Error al reproducir el video';
    switch(event.data) {
        case 2:
            errorMessage = 'Error: Parámetros inválidos';
            break;
        case 5:
            errorMessage = 'Error: El video no se puede reproducir';
            break;
        case 100:
            errorMessage = 'Error: Video no encontrado';
            break;
        case 101:
        case 150:
            errorMessage = 'Error: Este video no permite reproducción embebida';
            break;
    }
    showError(errorMessage);
    
    // Si hay error, intentar reproducir el siguiente
    playNext();
}

// Cuando el video termine, reproducir el siguiente
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        playNext();
    }
}

// Buscar videos
async function searchVideos() {
    const query = document.getElementById('search').value;
    if (!query) return;

    try {
        const response = await fetch(`/api/karaoke/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.error) {
            showError(data.error.message || 'Error en la búsqueda');
            return;
        }

        const results = data.items || [];
        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = results.map(item => `
            <div class="video-item" onclick="addToQueue('${item.id.videoId}', '${encodeURIComponent(item.snippet.title)}')">
                <img src="${item.snippet.thumbnails.medium.url}" alt="${item.snippet.title}">
                <p>${item.snippet.title}</p>
            </div>
        `).join('');
    } catch (error) {
        showError('Error al buscar videos');
    }
}

// Añadir video a la cola
async function addToQueue(videoId, title) {
    try {
        const response = await fetch('/api/karaoke/queue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoId: videoId,
                title: decodeURIComponent(title),
                user: 'Usuario' // Podrías pedir el nombre del usuario
            })
        });

        if (!response.ok) throw new Error('Error al añadir a la cola');
        updateQueue();
    } catch (error) {
        showError('Error al añadir a la cola');
    }
}

// Actualizar la vista de la cola
async function updateQueue() {
    try {
        const response = await fetch('/api/karaoke/queue');
        const queue = await response.json();

        const queueList = document.getElementById('queue');
        queueList.innerHTML = queue.map(item => `
            <div class="queue-item ${item.videoId === currentVideoId ? 'playing' : ''}">
                <img src="https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg" alt="${item.title}">
                <div>
                    <p>${item.title}</p>
                    <small>Añadido por: ${item.user}</small>
                </div>
            </div>
        `).join('');

        // Si no hay video reproduciéndose y hay items en la cola, reproducir el primero
        if (!currentVideoId && queue.length > 0) {
            playVideo(queue[0].videoId);
        }
    } catch (error) {
        showError('Error al actualizar la cola');
    }
}

// Reproducir video
function playVideo(videoId) {
    if (!videoId) {
        console.error('VideoId no válido');
        return;
    }

    try {
        if (player && player.loadVideoById) {
            currentVideoId = videoId;
            // Primero cargamos el video
            player.loadVideoById({
                'videoId': videoId,
                'startSeconds': 0,
                'suggestedQuality': 'large'
            });
            // Forzamos la reproducción por si acaso
            player.playVideo();
            updateQueue(); // Actualizar UI para mostrar qué está sonando
        } else {
            console.error('Player no inicializado correctamente');
            showError('Error al inicializar el reproductor. Por favor, recarga la página.');
        }
    } catch (error) {
        console.error('Error al reproducir:', error);
        showError('Error al reproducir el video');
    }
}

// Reproducir siguiente video
async function playNext() {
    try {
        await fetch('/api/karaoke/queue/next', { method: 'POST' });
        const queue = await (await fetch('/api/karaoke/queue')).json();
        
        if (queue.length > 0) {
            playVideo(queue[0].videoId);
        } else {
            currentVideoId = null;
            player.stopVideo();
        }
        updateQueue();
    } catch (error) {
        showError('Error al reproducir siguiente video');
    }
}

// Mostrar mensaje de error
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Actualizar la cola cada 10 segundos
setInterval(updateQueue, 10000);

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    updateQueue();
    
    // Event listener para la búsqueda
    document.getElementById('search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchVideos();
    });
});