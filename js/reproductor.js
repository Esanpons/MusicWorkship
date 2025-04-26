const WORKER_URL = localStorage.getItem('workerUrl');
const SECRET_KEY = localStorage.getItem('secretKey');

if (!WORKER_URL || !SECRET_KEY) {
    alert('No hi ha configuració guardada');
    window.location.href = 'index.html';
}

async function loadMedia() {
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path');
    const loading = document.getElementById('loading');
    const container = document.getElementById('mediaContainer');

    if (!path) {
        showMessage('No s\'ha especificat cap arxiu', 'error');
        return;
    }

    try {
        const isMP4 = path.toLowerCase().endsWith('.mp4');
        const format = isMP4 ? 'url' : 'base64';

        const response = await fetch(`${WORKER_URL}?path=${encodeURIComponent(path)}&format=${format}`, {
            headers: {
                'Authorization': `Bearer ${SECRET_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        const mediaElement = document.createElement(isMP4 ? 'video' : 'audio');
        mediaElement.controls = true;
        mediaElement.style.width = '100%';
        mediaElement.className = 'media-player';

        // Configurar eventos de monitoreo
        setupMediaEvents(mediaElement);

        // Establecer fuente según el formato
        if (isMP4 && data.url) {
            mediaElement.src = data.url;
        } else {
            const blob = new Blob(
                [Uint8Array.from(atob(data.base64_content), c => c.charCodeAt(0))],
                { type: data.content_type }
            );
            mediaElement.src = URL.createObjectURL(blob);
        }

        container.innerHTML = '';
        container.appendChild(mediaElement);

        // Mostrar el contenedor cuando el medio esté listo
        mediaElement.addEventListener('canplay', () => {
            loading.style.display = 'none';
            container.style.display = 'block';
            showMessage('', 'info'); // Limpiar mensajes previos
        });

        // Intentar reproducción automática
        try {
            await mediaElement.play();
        } catch (playError) {
            console.log('Reproducció automàtica no permesa pel navegador');
        }

    } catch (error) {
        showMessage(error.message, 'error');
        loading.style.display = 'none';
    }
}

function setupMediaEvents(mediaElement) {
    const events = ['loadstart', 'progress', 'suspend', 'abort', 'error', 'stalled', 'waiting'];
    
    events.forEach(event => {
        mediaElement.addEventListener(event, (e) => {
            if (event === 'error' && mediaElement.error) {
                showMessage(`Error de reproducció: ${mediaElement.error.message}`, 'error');
            }
        });
    });

    // Monitorear el buffering
    mediaElement.addEventListener('waiting', () => {
        showMessage('Carregant...', 'info');
    });

    mediaElement.addEventListener('playing', () => {
        showMessage('', 'info'); // Limpiar mensaje de carga
    });
}

function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message') || createMessageElement();
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = message ? 'block' : 'none';
}

function createMessageElement() {
    const div = document.createElement('div');
    div.id = 'message';
    document.body.insertBefore(div, document.getElementById('mediaContainer'));
    return div;
}

// Iniciar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', loadMedia);