const WORKER_URL = localStorage.getItem('workerUrl');
const SECRET_KEY = localStorage.getItem('secretKey');

if (!WORKER_URL || !SECRET_KEY) {
    alert('No hi ha configuració guardada');
    window.location.href = 'index.html';
}

async function loadMedia() {
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path');

    if (!path) {
        alert('No s\'ha especificat cap arxiu');
        return;
    }

    const loading = document.getElementById('loading');
    const container = document.getElementById('mediaContainer');

    try {
        const response = await fetch(`${WORKER_URL}?path=${encodeURIComponent(path)}&format=base64`, {
            headers: {
                'Authorization': `Bearer ${SECRET_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al carregar l\'arxiu');
        }

        const data = await response.json();
        
        // Determinar si és àudio o vídeo
        const isVideo = path.toLowerCase().endsWith('.mp4');
        const mediaElement = document.createElement(isVideo ? 'video' : 'audio');
        
        mediaElement.controls = true;
        mediaElement.style.width = '100%';

        // Crear URL segura
        const blob = new Blob(
            [Uint8Array.from(atob(data.base64_content), c => c.charCodeAt(0))],
            { type: data.content_type }
        );
        mediaElement.src = URL.createObjectURL(blob);
        
        // Mostrar el contenidor quan el medi estigui llest
        mediaElement.onloadeddata = () => {
            loading.style.display = 'none';
            container.style.display = 'block';
        };

        container.innerHTML = '';
        container.appendChild(mediaElement);

        // Intentar reproducció automàtica
        try {
            await mediaElement.play();
        } catch (playError) {
            console.log('Reproducció automàtica no permesa');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al carregar l\'arxiu');
        loading.style.display = 'none';
    }
}

// Iniciar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', loadMedia);