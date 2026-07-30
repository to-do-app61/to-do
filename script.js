// ==========================================
// SELEZIONE ELEMENTI DEL DOM
// ==========================================
const taskNameInput = document.getElementById('taskName');
const taskTimeInput = document.getElementById('taskTime');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const exportBtn = document.getElementById('exportData');
const importBtn = document.getElementById('importData');
const shareBtn = document.getElementById('shareBtn');

// Elementi per la Wake Lock API
const statusText = document.getElementById('statusText');
const dot = document.querySelector('.dot');

// ==========================================
// STATO E PERSISTENZA DATI
// ==========================================
// Carichiamo i task dal localStorage o inizializziamo un array vuoto
let tasks = JSON.parse(localStorage.getItem('myTasks')) || [];

function saveTasks() {
    localStorage.setItem('myTasks', JSON.stringify(tasks));
}

function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
            <div class="task-info">
                <btitle>${task.name}</btitle>
                <span>Orario: ${task.time}</span>
            </div>
            <button class="delete-btn" onclick="deleteTask(${index})">Elimina</button>
        `;
        taskList.appendChild(li);
    });
}

// ==========================================
// LOGICA CORE TASKS
// ==========================================
function addTask() {
    const name = taskNameInput.value;
    const time = taskTimeInput.value;

    if (name && time) {
        const newTask = {
            id: Date.now(),
            name: name,
            time: time,
            triggered: false
        };
        tasks.push(newTask);
        saveTasks();
        renderTasks();
        
        // Reset campi input
        taskNameInput.value = '';
        taskTimeInput.value = '';
        
        // Attiva la modalità schermo attivo
        requestWakeLock();
    } else {
        alert("Per favore, inserisci sia il nome che l'orario!");
    }
}

window.deleteTask = function(index) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}

// ==========================================
// MOTORE ALARMO (SONORO E VISIVO)
// ==========================================
// Controlla ogni secondo se un task deve scadere
setInterval(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    tasks.forEach(task => {
        if (task.time === currentTime && !task.triggered) {
            triggerAlarm(task);
            task.triggered = true;
            saveTasks();
        }
    });
}, 1000);

function triggerAlarm(task) {
    // 1. Feedback Visivo Pulsante
    document.body.style.backgroundColor = "#ff4757";
    
    // 2. Sintesi Sonora Avanzata (Oscillatore + LFO)
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const playPulse = () => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'triangle'; // Suono più pieno e meno stridente
        // Frequenza variabile per creare un effetto "sirena"
        osc.frequency.setValueAtTime(300 + Math.random() * 400, audioCtx.currentTime);
        
        // LFO (Low Frequency Oscillator) per far oscillare la frequenza
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(5, audioCtx.currentTime); // 5Hz di oscillazione
        lfoGain.gain.setValueAtTime(200, audioCtx.currentTime);
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        lfo.start();
        
        setTimeout(() => {
            osc.stop();
            lfo.stop();
        }, 800);
    };

    let count = 0;
    const interval = setInterval(() => {
        playPulse();
        count++;
        if (count > 8) clearInterval(interval); // Ripetizione ciclica del suono
    }, 600);

    // 3. Notifica Visiva standard
    setTimeout(() => {
        alert(`⚠️ ALLARME: ${task.name}`);
        document.body.style.backgroundColor = "var(--bg-color)";
    }, 500);
}

// ==========================================
// WAKE LOCK API (Mantenere schermo acceso)
// ==========================================
let wakeLock = null;

async function requestWakeLock() {
    try {
        // Richiedi al browser di non spegnere lo schermo
        wakeLock = await navigator.requestWakeLock('screen');
        
        statusText.innerText = "Attiva";
        dot.classList.add('active');
        console.log("Wake Lock acquisito");
    } catch (err) {
        console.error(`${err}`);
        statusText.innerText = "Non supportata";
    }
}

function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
        statusText.innerText = "Disattivata";
        dot.classList.remove('active');
        console.log("Wake Lock rilasciato");
    }
}

// Richiedi il lock quando si aggiunge un task
addTaskBtn.addEventListener('click', () => {
    addTask();
    requestWakeLock();
});

// Rilascia il lock quando l'app non è più visibile (risparmio batteria)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        releaseWakeLock();
    } else {
        // Quando l'utente torna nell'app, riprendiamo il lock se ci sono task
        if (tasks.length > 0) {
            requestWakeLock();
        }
    }
});

// ==========================================
// PORTABILITÀ E CONDIVISIONE
// ==========================================

// Esporta i task in un file JSON scaricabile
exportBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(tasks);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'my_tasks.json');
    link.click();
});

// Importa i task da un file JSON selezionato
importBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = event => {
            try {
                tasks = JSON.parse(event.target.result);
                saveTasks();
                renderTasks();
                alert("Task importati con successo!");
            } catch (e) {
                alert("Errore nel file JSON caricato.");
            }
        };
        reader.readAsText(file);
    };
    input.click();
});

// Condivisione nativa (Web Share API)
shareBtn.addEventListener('click', async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'TaskAlarm',
                text: 'Usa questa app per gestire i tuoi task con allarmi locali!',
                url: window.location.href
            });
        } catch (err) {
            console.log('Errore condivisione', err);
        }
    } else {
        prompt(`Condividi il link dell'app:\n${window.location.href}`);
    }
});

// ==========================================
// INITIALIZATION
// ==========================================

// Registrazione Service Worker per il supporto Offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker attivo'))
            .catch(err => console.log('Errore SW', err));
    });
}

// Render iniziale della lista
renderTasks();
