let WORKER_URL;
let SECRET_KEY;

function checkConfig() {
    WORKER_URL = localStorage.getItem('workerUrl');
    SECRET_KEY = localStorage.getItem('secretKey');

    if (WORKER_URL && SECRET_KEY) {
        document.getElementById('configForm').style.display = 'none';
        document.getElementById('content').style.display = 'block';
        fetchFiles();
    } else {
        document.getElementById('configForm').style.display = 'block';
        document.getElementById('content').style.display = 'none';
    }
}

function saveConfig() {
    const workerUrl = document.getElementById('workerUrl').value.trim();
    const secretKey = document.getElementById('secretKey').value.trim();

    if (!workerUrl || !secretKey) {
        alert('Si us plau, omple tots els camps');
        return;
    }

    localStorage.setItem('workerUrl', workerUrl);
    localStorage.setItem('secretKey', secretKey);
    checkConfig();
}

function resetConfig() {
    if (confirm('Estàs segur que vols reiniciar la configuració?')) {
        localStorage.removeItem('workerUrl');
        localStorage.removeItem('secretKey');
        checkConfig();
    }
}

async function fetchFiles() {
    const loading = document.getElementById('loading');
    const fileList = document.getElementById('fileList');
    
    loading.style.display = 'block';
    fileList.style.display = 'none';

    try {
        const response = await fetch(WORKER_URL, {
            headers: {
                'Authorization': `Bearer ${SECRET_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al carregar els arxius');
        }

        const files = await response.json();
        fileList.innerHTML = '';
        
        files.forEach(file => {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.textContent = file.name;
            li.addEventListener('click', () => {
                window.location.href = `reproductor.html?path=${encodeURIComponent(file.path_lower)}`;
            });
            fileList.appendChild(li);
        });

        loading.style.display = 'none';
        fileList.style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        alert('Error al carregar els arxius');
        loading.style.display = 'none';
    }
}

// Iniciar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', checkConfig);