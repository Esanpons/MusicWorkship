const WORKER_URL = localStorage.getItem('workerUrl');
const SECRET_KEY = localStorage.getItem('secretKey');

if (!WORKER_URL || !SECRET_KEY) {
    alert('No hi ha configuració guardada');
    window.location.href = 'index.html';
}

async function loadMedia() {
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path');
    const debug = document.getElementById('debug');
    const errorDiv = document.getElementById('error');

    if (!path) {
        showError('No s\'ha especificat cap arxiu');
        return;
    }

    const loading = document.getElementById('loading');
    const container = document.getElementById('mediaContainer');

    try {
        // Primer intentamos con format=url para archivos MP4
        const isMP4 = path.toLowerCase().endsWith('.mp4');
        const format = isMP4 ? 'url' : 'base64';

        showDebug(`Intentant carregar arxiu: ${path}\nFormat: ${format}`);

        const response = await fetch(`${WORKER_URL}?path=${encodeURIComponent(path)}&format=${format}`, {
            headers: {
                'Authorization': `Bearer ${SECRET_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
        }

        const data = await response.json();
        showDebug(`Resposta rebuda: ${JSON.stringify(data, null, 2)}`);

        if (data.error) {
            throw new Error(data.error);
        }

        // Determinar si és àudio o vídeo
        const isVideo = path.toLowerCase().endsWith('.mp4');
        const mediaElement = document.createElement(isVideo ? 'video' : 'audio');
        
        mediaElement.controls = true;
        mediaElement.style.width = '100%';

        // Para MP4, usamos la URL directa
        if (isMP4 && data.url) {
            mediaElement.src = data.url;
        } else {
            // Para otros formatos, usamos base64
            const blob = new Blob(
                [Uint8Array.from(atob(data.base64_content), c => c.charCodeAt(0))],
                { type: data.content_type }
            );
            mediaElement.src = URL.createObjectURL(blob);
        }

        // Eventos del elemento multimedia
        mediaElement.onerror = (e) => {
            showError(`Error en carregar el mitjà: ${mediaElement.error.message}`);
            showDebug(`Error de mitjà: ${mediaElement.error.code} - ${mediaElement.error.message}`);
        };
        
        mediaElement.onloadeddata = () => {
            loading.style.display = 'none';
            container.style.display = 'block';
            errorDiv.style.display = 'none';
        };

        container.innerHTML = '';
        container.appendChild(mediaElement);

        // Intentar reproducció automàtica
        try {
            await mediaElement.play();
        } catch (playError) {
            showDebug('Reproducció automàtica no permesa');
        }
    } catch (error) {
        showError(`Error: ${error.message}`);
        showDebug(`Error complet: ${error.stack || error}`);
        loading.style.display = 'none';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    document.getElementById('loading').style.display = 'none';
}

function showDebug(message) {
    const debug = document.getElementById('debug');
    debug.textContent += message + '\n\n';
    debug.style.display = 'block';
}

// Iniciar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', loadMedia);

// Añadir tecla para mostrar/ocultar debug
document.addEventListener('keydown', (e) => {
    if (e.key === 'D' && e.ctrlKey) {
        const debug = document.getElementById('debug');
        debug.style.display = debug.style.display === 'none' ? 'block' : 'none';
    }
});