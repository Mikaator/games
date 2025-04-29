/**
 * Zahlenschätzer - Spiellogik
 */

// Spielzustand
class NumberGuessGame {
    constructor() {
        // Spiel-Grundeinstellungen
        this.minNumber = 1;
        this.maxNumber = 100;
        this.cooldownSeconds = 30;
        
        // Spielzustände
        this.targetNumber = null;
        this.isGameActive = false;
        this.userAttempts = {}; // Speichert die Anzahl der Versuche pro Benutzer
        this.userCooldowns = {}; // Speichert Cooldown-Zeitstempel
        this.gameStartTime = null;
        this.roundNumber = 0;
        
        // Highscores
        this.highscores = [];
        
        // Elemente im DOM referenzieren
        this.initDOMElements();
        
        // Twitch-Chat initialisieren
        this.twitchChat = new TwitchChat();
        
        // Storage für Spielstand und Konfiguration
        this.storage = new GameStorage('number-guess');
        
        // Event-Listener hinzufügen
        this.initEventListeners();
        
        // Gespeicherte Daten laden (wenn vorhanden)
        this.loadSavedData();
    }
    
    // DOM-Elemente referenzieren
    initDOMElements() {
        // Einstellungsfelder
        this.channelInput = document.getElementById('twitch-channel');
        this.minNumberInput = document.getElementById('min-number');
        this.maxNumberInput = document.getElementById('max-number');
        this.cooldownInput = document.getElementById('cooldown');
        
        // Buttons
        this.connectButton = document.getElementById('connect-btn');
        this.startGameButton = document.getElementById('start-game-btn');
        this.downloadConfigButton = document.getElementById('download-config-btn');
        this.uploadConfigButton = document.getElementById('upload-config-btn');
        this.sendCommandButton = document.getElementById('send-command');
        
        // Spielstatus- und Nachrichtenelemente
        this.gameMessage = document.getElementById('game-message');
        this.currentStatus = document.getElementById('current-status');
        this.highscoreTable = document.getElementById('highscore-body');
        this.twitchContainer = document.getElementById('twitch-container');
        this.manualCommandInput = document.getElementById('manual-command');
    }
    
    // Event-Listener hinzufügen
    initEventListeners() {
        // Twitch-Verbindung
        this.connectButton.addEventListener('click', () => this.connectToTwitch());
        
        // Spielstart
        this.startGameButton.addEventListener('click', () => this.startNewGame());
        
        // Konfiguration herunterladen/hochladen
        this.downloadConfigButton.addEventListener('click', () => this.downloadConfig());
        this.uploadConfigButton.addEventListener('click', () => this.uploadConfig());
        
        // Manuelle Kommandos senden
        this.sendCommandButton.addEventListener('click', () => this.sendManualCommand());
        this.manualCommandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendManualCommand();
        });
        
        // Eingabefeld-Validierung für Min/Max-Zahlen
        this.minNumberInput.addEventListener('change', () => {
            const min = parseInt(this.minNumberInput.value);
            const max = parseInt(this.maxNumberInput.value);
            if (min >= max) {
                this.minNumberInput.value = max - 1;
            }
        });
        
        this.maxNumberInput.addEventListener('change', () => {
            const min = parseInt(this.minNumberInput.value);
            const max = parseInt(this.maxNumberInput.value);
            if (max <= min) {
                this.maxNumberInput.value = min + 1;
            }
        });
    }
    
    // Gespeicherte Daten laden
    loadSavedData() {
        const savedData = this.storage.load();
        if (savedData) {
            // Einstellungen wiederherstellen
            if (savedData.settings) {
                if (savedData.settings.minNumber) this.minNumberInput.value = savedData.settings.minNumber;
                if (savedData.settings.maxNumber) this.maxNumberInput.value = savedData.settings.maxNumber;
                if (savedData.settings.cooldown) this.cooldownInput.value = savedData.settings.cooldown;
                if (savedData.settings.channel) this.channelInput.value = savedData.settings.channel;
            }
            
            // Highscores wiederherstellen
            if (savedData.highscores) {
                this.highscores = savedData.highscores;
                this.updateHighscoreTable();
            }
        }
    }
    
    // Aktuelle Einstellungen speichern
    saveSettings() {
        const settingsData = {
            settings: {
                minNumber: parseInt(this.minNumberInput.value),
                maxNumber: parseInt(this.maxNumberInput.value),
                cooldown: parseInt(this.cooldownInput.value),
                channel: this.channelInput.value
            },
            highscores: this.highscores
        };
        
        this.storage.save(settingsData);
    }
    
    // Mit Twitch verbinden
    connectToTwitch() {
        const channel = this.channelInput.value.trim();
        
        if (!channel) {
            this.setGameMessage('Bitte gib einen Twitch-Kanalnamen ein.', 'error');
            return;
        }
        
        this.setGameMessage('Verbindung zu Twitch wird hergestellt...', 'info');
        this.connectButton.disabled = true;
        
        // Versuche, zum Twitch-Chat zu verbinden
        this.twitchChat.connect(channel)
            .then(() => {
                this.setGameMessage('Erfolgreich mit Twitch verbunden! Du kannst nun ein Spiel starten.', 'success');
                this.connectButton.textContent = 'Verbunden';
                this.startGameButton.disabled = false;
                
                // Chat-Container für Nachrichtenanzeige einstellen
                this.twitchChat.setChatContainer(this.twitchContainer);
                
                // Auf Chat-Nachrichten hören
                this.twitchChat.onMessage((username, message) => {
                    this.handleChatMessage(username, message);
                });
                
                // Einstellungen speichern
                this.saveSettings();
            })
            .catch(error => {
                console.error('Twitch-Verbindungsfehler:', error);
                this.setGameMessage('Fehler bei der Verbindung zum Twitch-Chat. Bitte überprüfe den Kanalnamen.', 'error');
                this.connectButton.disabled = false;
            });
    }
    
    // Neues Spiel starten
    startNewGame() {
        // Spieleinstellungen aktualisieren
        this.minNumber = parseInt(this.minNumberInput.value);
        this.maxNumber = parseInt(this.maxNumberInput.value);
        this.cooldownSeconds = parseInt(this.cooldownInput.value);
        
        // Zufällige Zahl auswählen
        this.targetNumber = Utils.randomInt(this.minNumber, this.maxNumber);
        
        // Spielstatus zurücksetzen
        this.isGameActive = true;
        this.userAttempts = {};
        this.gameStartTime = Date.now();
        this.roundNumber++;
        
        // Spielstart verkünden
        const message = `Neue Runde (#${this.roundNumber}): Ich denke an eine Zahl zwischen ${this.minNumber} und ${this.maxNumber} – ratet mit !guess <Zahl>`;
        this.setGameMessage(message, 'info');
        this.currentStatus.textContent = `Aktuelle Ziel-Zahl: ${this.targetNumber} (nur für Administratoren sichtbar)`;
        
        console.log(`Neue Runde gestartet. Zielzahl: ${this.targetNumber}`);
    }
    
    // Chat-Nachricht verarbeiten
    handleChatMessage(username, message) {
        if (!this.isGameActive) return;
        
        // Auf !guess Kommando prüfen
        const guessMatch = message.match(/^!guess\s+(\d+)$/i);
        if (!guessMatch) return;
        
        const guessedNumber = parseInt(guessMatch[1]);
        
        // Prüfen, ob im gültigen Zahlenbereich
        if (guessedNumber < this.minNumber || guessedNumber > this.maxNumber) {
            // Optional: Fehlermeldung zurücksenden
            return;
        }
        
        // Cooldown prüfen
        const now = Date.now();
        if (this.userCooldowns[username] && (now - this.userCooldowns[username]) < (this.cooldownSeconds * 1000)) {
            // Benutzer ist noch im Cooldown
            const remainingSeconds = Math.ceil((this.userCooldowns[username] + (this.cooldownSeconds * 1000) - now) / 1000);
            // Optional: Cooldown-Nachricht an Benutzer
            return;
        }
        
        // Cooldown setzen
        this.userCooldowns[username] = now;
        
        // Rateversuch zählen
        if (!this.userAttempts[username]) {
            this.userAttempts[username] = 0;
        }
        this.userAttempts[username]++;
        
        // Rateversuch auswerten
        if (guessedNumber === this.targetNumber) {
            // Richtig geraten!
            const attempts = this.userAttempts[username];
            const timeTaken = ((now - this.gameStartTime) / 1000).toFixed(1);
            
            const winMessage = `Glückwunsch, ${username} hat es in ${attempts} Versuchen erraten! Die Zahl war ${this.targetNumber}. Zeit: ${timeTaken} Sekunden.`;
            this.setGameMessage(winMessage, 'success');
            
            // Zur Highscore-Liste hinzufügen
            this.addHighscore(username, attempts, timeTaken);
            
            // Spiel beenden
            this.isGameActive = false;
            this.startGameButton.textContent = 'Neues Spiel starten';
            
        } else if (guessedNumber < this.targetNumber) {
            // Zu niedrig geraten
            this.setGameMessage(`${username} rät ${guessedNumber}: Höher!`, 'info');
        } else {
            // Zu hoch geraten
            this.setGameMessage(`${username} rät ${guessedNumber}: Tiefer!`, 'info');
        }
    }
    
    // Highscore hinzufügen
    addHighscore(username, attempts, timeTaken) {
        this.highscores.push({
            username,
            attempts: parseInt(attempts),
            time: parseFloat(timeTaken),
            date: new Date().toISOString()
        });
        
        // Nach Versuchen (primär) und Zeit (sekundär) sortieren
        this.highscores.sort((a, b) => {
            if (a.attempts !== b.attempts) {
                return a.attempts - b.attempts;
            }
            return a.time - b.time;
        });
        
        // Höchstens 10 Einträge behalten
        if (this.highscores.length > 10) {
            this.highscores = this.highscores.slice(0, 10);
        }
        
        // Highscore-Tabelle aktualisieren und speichern
        this.updateHighscoreTable();
        this.saveSettings();
    }
    
    // Highscore-Tabelle aktualisieren
    updateHighscoreTable() {
        this.highscoreTable.innerHTML = '';
        
        this.highscores.forEach((score, index) => {
            const row = document.createElement('tr');
            
            const placeCell = document.createElement('td');
            placeCell.textContent = index + 1;
            
            const nameCell = document.createElement('td');
            nameCell.textContent = score.username;
            
            const attemptsCell = document.createElement('td');
            attemptsCell.textContent = score.attempts;
            
            const timeCell = document.createElement('td');
            timeCell.textContent = `${score.time} s`;
            
            row.appendChild(placeCell);
            row.appendChild(nameCell);
            row.appendChild(attemptsCell);
            row.appendChild(timeCell);
            
            this.highscoreTable.appendChild(row);
        });
    }
    
    // Spielnachricht setzen
    setGameMessage(message, type = 'info') {
        this.gameMessage.textContent = message;
        
        // CSS-Klassen für verschiedene Nachrichtentypen
        this.gameMessage.className = 'game-message';
        if (type === 'error') {
            this.gameMessage.classList.add('message-error');
        } else if (type === 'success') {
            this.gameMessage.classList.add('message-success');
        } else {
            this.gameMessage.classList.add('message-info');
        }
        
        // Kurze Animation hinzufügen
        this.gameMessage.classList.add('highlight-message');
        setTimeout(() => {
            this.gameMessage.classList.remove('highlight-message');
        }, 1500);
    }
    
    // Konfiguration herunterladen
    downloadConfig() {
        this.saveSettings();
        this.storage.downloadConfig();
    }
    
    // Konfiguration hochladen
    uploadConfig() {
        this.storage.uploadConfig(data => {
            if (data && data.settings) {
                // Einstellungen aktualisieren
                if (data.settings.minNumber) this.minNumberInput.value = data.settings.minNumber;
                if (data.settings.maxNumber) this.maxNumberInput.value = data.settings.maxNumber;
                if (data.settings.cooldown) this.cooldownInput.value = data.settings.cooldown;
                if (data.settings.channel) this.channelInput.value = data.settings.channel;
            }
            
            if (data && data.highscores) {
                this.highscores = data.highscores;
                this.updateHighscoreTable();
            }
            
            this.setGameMessage('Konfiguration erfolgreich geladen!', 'success');
        });
    }
    
    // Manuelles Kommando senden
    sendManualCommand() {
        const command = this.manualCommandInput.value.trim();
        if (!command) return;
        
        // Kommando in Spiellogik verarbeiten
        const dummyUsername = 'TestUser' + Math.floor(Math.random() * 1000);
        this.handleChatMessage(dummyUsername, command);
        
        // Auch im Chat anzeigen
        if (this.twitchChat.chatContainer) {
            this.twitchChat.addMessageToContainer(dummyUsername, command);
        }
        
        // Eingabefeld leeren
        this.manualCommandInput.value = '';
    }
}

// Spiel initialisieren, wenn das Dokument geladen ist
document.addEventListener('DOMContentLoaded', () => {
    const game = new NumberGuessGame();
}); 