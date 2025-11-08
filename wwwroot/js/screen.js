let player;
let currentVideoId = null;
let hideInfoTimeout;

// Inicializar el reproductor de YouTube
function onYouTubeIframeAPIReady() {
    console.log('YouTube API Ready'); // Debug
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        playerVars: {
            'playsinline': 1,
            'enablejsapi': 1,
            'origin': window.location.origin,
            'autoplay': 1,
            'rel': 0,
            'controls': 1, // Habilitamos controles por si acaso
            'modestbranding': 1,
            'showinfo': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    console.log('Player ready'); // Debug
    
    // Configurar volumen inicial
    event.target.setVolume(100);
    
    // Comprobar la cola inmediatamente
    updateQueue();
    
    // Verificar si hay reproducción cada 2 segundos
    setInterval(() => {
        if (currentVideoId && player.getPlayerState() !== YT.PlayerState.PLAYING) {
            console.log('Detectada pausa no intencional, reiniciando reproducción...'); // Debug
            player.playVideo();
        }
    }, 2000);
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        playNext();
    }
}

function onPlayerError(event) {
    console.error('Player error:', event.data);
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
    playNext();
}

async function updateQueue() {
    try {
        const queue = await KaraokeService.getQueue();
        console.log('Cola actual:', queue); // Debug

        if (queue.length > 0) {
            // Si no hay video actual o el primer video en cola es diferente al actual
            if (!currentVideoId || (queue[0].videoId !== currentVideoId)) {
                console.log('Reproduciendo nuevo video:', queue[0].videoId); // Debug
                playVideo(queue[0].videoId, queue[0].title, queue[0].user);
            }
            updateNowPlaying(queue);
        } else {
            console.log('Cola vacía'); // Debug
            currentVideoId = null;
            if (player && player.stopVideo) {
                player.stopVideo();
            }
            document.querySelector('.now-playing').classList.add('hide');
        }
    } catch (error) {
        console.error('Error en updateQueue:', error); // Debug
        showError(error.message);
    }
}

function updateNowPlaying(queue) {
    const nowPlaying = document.querySelector('.now-playing');
    const currentSong = queue.find(item => item.videoId === currentVideoId);
    
    if (currentSong) {
        document.querySelector('.song-title').textContent = currentSong.title;
        document.querySelector('.song-user').textContent = `Añadido por: ${currentSong.user}`;
        document.querySelector('.queue-info').textContent = 
            `En cola: ${queue.length - queue.indexOf(currentSong) - 1}`;
        
        nowPlaying.classList.remove('hide');
        
        // Ocultar información después de 5 segundos
        clearTimeout(hideInfoTimeout);
        hideInfoTimeout = setTimeout(() => {
            nowPlaying.classList.add('hide');
        }, 5000);
    }
}

function playVideo(videoId, title, user) {
    console.log('Intentando reproducir:', videoId); // Debug

    if (!videoId) {
        console.error('VideoId no válido');
        return;
    }

    try {
        if (player && player.loadVideoById) {
            currentVideoId = videoId;
            player.loadVideoById({
                'videoId': videoId,
                'startSeconds': 0,
                'suggestedQuality': 'large'
            });
            
            // Forzar reproducción
            setTimeout(() => {
                if (player.getPlayerState() !== YT.PlayerState.PLAYING) {
                    console.log('Forzando reproducción...'); // Debug
                    player.playVideo();
                }
            }, 1000);

        } else {
            console.error('Player no inicializado');
            showError('Error: reproductor no inicializado');
        }
    } catch (error) {
        console.error('Error al reproducir:', error);
        showError('Error al reproducir el video');
    }
}

async function playNext() {
    try {
        await KaraokeService.markNextPlayed();
        updateQueue();
    } catch (error) {
        showError(error.message);
    }
}

// Mostrar/ocultar información al mover el ratón
document.addEventListener('mousemove', () => {
    const nowPlaying = document.querySelector('.now-playing');
    nowPlaying.classList.remove('hide');
    
    clearTimeout(hideInfoTimeout);
    hideInfoTimeout = setTimeout(() => {
        nowPlaying.classList.add('hide');
    }, 5000);
});

// Actualizar la cola periódicamente
setInterval(updateQueue, 10000);