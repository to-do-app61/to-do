// Selezioniamo gli elementi del DOM
const taskNameInput = document.getElementById('taskName');
const taskTimeInput = document.getElementById('taskTime');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const exportBtn = document.getElementById('exportData');
const importBtn = document.getElementById('importData');
const shareBtn = document.getElementById('shareBtn');

// Stato dell'applicazione: Caricamento dal localStorage
let tasks = JSON.parse(localStorage.getItem('myTasks')) || [];

// --- FUNZIONI DI GESTIONE DATI ---

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
                <b>${task.name}</b>
                <span>Orario: ${task.time}</span>
            </div>
            <button class="delete-btn" onclick="deleteTask(${index})">Elimina</button>
        `;
        taskList.appendChild(li);
    });
}

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
        taskNameInput.value = '';
        taskTimeInput.value = '';
    } else {
        alert("Inserisci nome e orario!");
    }
}

window.deleteTask = function(index) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}

// --- MOTORE ALARMO ---

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
    // Feedback Visivo Pulsante
    document.body.style.backgroundColor = "#ff4757";
    
    // Sintesi Sonora Avanzata (Oscillatore + LFO)
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const playPulse = () => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'triangle';
        // Frequenza variabile per creare un effetto "allarme"
        osc.frequency.setValueAtTime(300 + Math.random() * 400, audioCtx.currentTime);
        
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(5, audioCtx.currentTime);
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
        if (count > 8) clearInterval(interval);
    }, 600);

    // Notifica visiva standard
    setTimeout(() => {
        alert(`⚠️ ALLARME: ${task.name}`);
        document.body.style.backgroundColor = "var(--bg-color)";
    }, 500);
}

// --- PORTABILITÀ E CONDIVISIONE ---

exportBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(tasks);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'my_tasks.json');
    link.click();
});

importBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = event => {
            tasks = JSON.parse(event.target.result);
            saveTasks();
            renderTasks();
            alert("Importati con successo!");
        };
        reader.readAsText(file);
    };
    input.click();
});

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

// Registrazione Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker attivo'))
            .catch(err => console.log('Errore SW', err));
    });
}

addTaskBtn.addEventListener('click', addTask);
renderTasks();
