// Selezioniamo gli elementi del DOM
const taskNameInput = document.getElementById('taskName');
const taskTimeInput = document.getElementById('taskTime');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const exportBtn = document.getElementById('exportData');
const importBtn = document.getElementById('importData');

// Stato dell'applicazione: un array di oggetti task
// Carichiamo i dati dal localStorage all'avvio o usiamo un array vuoto
let tasks = JSON.parse(localStorage.getItem('myTasks')) || [];

// --- FUNZIONI CORE ---

// Funzione per salvare i task nel localStorage
function saveTasks() {
    localStorage.setItem('myTasks', JSON.stringify(tasks));
}

// Funzione per renderizzare la lista dei task nell'HTML
function renderTasks() {
    taskList.innerHTML = ''; // Svuota la lista attuale

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

// Funzione per aggiungere un nuovo task
function addTask() {
    const name = taskNameInput.value;
    const time = taskTimeInput.value;

    if (name && time) {
        const newTask = {
            id: Date.now(),
            name: name,
            time: time,
            triggered: false // Flag per non far scattare l'allarme più volte
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();

        // Reset campi input
        taskNameInput.value = '';
        taskTimeInput.value = '';
    } else {
        alert("Per favore, inserisci sia il nome che l'orario.");
    }
}

// Funzione per eliminare un task
window.deleteTask = function(index) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}

// --- LOGICA ALARMO ---

// Controlla ogni secondo se un task deve scadere
setInterval(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    tasks.forEach(task => {
        if (task.time === currentTime && !task.triggered) {
            triggerAlarm(task);
            task.triggered = true; // Impedisce ripetizioni ogni secondo
            saveTasks(); // Salva lo stato "attivato"
        }
    });
}, 1000);

// Azione dell'allarme (Sonoro e Visivo)
function triggerAlarm(task) {
    // Segnale Visivo: Cambio stile del corpo della pagina
    document.body.style.backgroundColor = "#ff4757";
    
    // Segnale Sonoro: Creiamo un "beep" usando l'AudioContext (non serve un file audio esterno)
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // Nota LA
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 2); // Suona per 2 secondi

    // Alert visivo extra
    alert(`⚠️ ALLARME: ${task.name}`);
    
    // Dopo 5 secondi torna il colore normale
    setTimeout(() => {
        document.body.style.backgroundColor = "var(--bg-color)";
    }, 5000);
}

// --- PORTABILITÀ (Esportazione/Importazione) ---

// Esporta i task in un file JSON scaricabile
exportBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(tasks);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'my_tasks.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
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
            tasks = JSON.parse(event.target.result);
            saveTasks();
            renderTasks();
            alert("Task importati con successo!");
        };
        reader.readAsText(file);
    };
    input.click();
});

// Event Listener per il pulsante aggiungi
addTaskBtn.addEventListener('click', addTask);

// Render iniziale
renderTasks();


// Registrazione del Service Worker per il supporto Offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registrato con successo!'))
            .catch(err => console.log('Errore nella registrazione del Service Worker', err));
    });
}