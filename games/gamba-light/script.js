/**
 * Gamba Light (Mini-Roulette) - Spiellogik
 */

class GambaLightGame {
    constructor() {
        // Spiel-Einstellungen
        this.startingBalance = 1000;
        this.redChance = 50;
        this.blackChance = 45;
        this.greenChance = 5;
        this.redMultiplier = 2;
        this.blackMultiplier = 2;
        this.greenMultiplier = 14;
        
        // Spielzustände
        this.isSpinning = false;
        this.players = {}; // Speichert Spielerdaten
        this.currentBets = []; // Aktuelle Wetten für diese Runde
        this.history = []; // Spielverlauf
        
        // Rad-Segmente
        this.segments = [];
        
        // Elemente im DOM referenzieren
        this.initDOMElements();
        
        // Twitch-Chat initialisieren
        this.twitchChat = new TwitchChat();
        
        // Storage für Spielstand und Konfiguration
        this.storage = new GameStorage('gamba-light');
        
        // Event-Listener hinzufügen
        this.initEventListeners();
        
        // Gespeicherte Daten laden (wenn vorhanden)
        this.loadSavedData();
        
        // Roulette-Rad initialisieren
        this.initRouletteWheel();
    }
    
    // DOM-Elemente referenzieren
    initDOMElements() {
        // Einstellungsfelder
        this.channelInput = document.getElementById('twitch-channel');
        this.startingBalanceInput = document.getElementById('starting-balance');
        this.redChanceInput = document.getElementById('red-chance');
        this.blackChanceInput = document.getElementById('black-chance');
        this.greenChanceInput = document.getElementById('green-chance');
        this.redMultiplierInput = document.getElementById('red-multiplier');
        this.blackMultiplierInput = document.getElementById('black-multiplier');
        this.greenMultiplierInput = document.getElementById('green-multiplier');
        
        // Buttons
        this.connectButton = document.getElementById('connect-btn');
        this.spinWheelButton = document.getElementById('spin-wheel-btn');
        this.downloadConfigButton = document.getElementById('download-config-btn');
        this.uploadConfigButton = document.getElementById('upload-config-btn');
        this.sendCommandButton = document.getElementById('send-command');
        
        // Spielstatus- und Nachrichtenelemente
        this.gameMessage = document.getElementById('game-message');
        this.rouletteWheel = document.getElementById('roulette-wheel');
        this.wheelSegments = document.getElementById('wheel-segments');
        this.historyContainer = document.getElementById('history-container');
        this.playerList = document.getElementById('player-list');
        this.twitchContainer = document.getElementById('twitch-container');
        this.manualCommandInput = document.getElementById('manual-command');
    }
    
    // Event-Listener hinzufügen
    initEventListeners() {
        // Twitch-Verbindung
        this.connectButton.addEventListener('click', () => this.connectToTwitch());
        
        // Rad drehen
        this.spinWheelButton.addEventListener('click', () => this.spinWheel());
        
        // Konfiguration herunterladen/hochladen
        this.downloadConfigButton.addEventListener('click', () => this.downloadConfig());
        this.uploadConfigButton.addEventListener('click', () => this.uploadConfig());
        
        // Manuelle Kommandos senden
        this.sendCommandButton.addEventListener('click', () => this.sendManualCommand());
        this.manualCommandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendManualCommand();
        });
        
        // Prozentwerte validieren (insgesamt 100%)
        const validatePercentages = () => {
            const red = parseInt(this.redChanceInput.value) || 0;
            const black = parseInt(this.blackChanceInput.value) || 0;
            const green = parseInt(this.greenChanceInput.value) || 0;
            
            const total = red + black + green;
            
            if (total !== 100) {
                // Anpassung der Werte, damit die Summe 100% ist
                if (green < 5) {
                    // Garantiere mindestens 5% für Grün
                    this.greenChanceInput.value = 5;
                    const remaining = 95;
                    const redPercent = Math.round((red / (red + black)) * remaining);
                    this.redChanceInput.value = redPercent;
                    this.blackChanceInput.value = remaining - redPercent;
                } else {
                    // Proportionale Anpassung
                    const remaining = 100 - green;
                    const redPercent = Math.round((red / (red + black)) * remaining);
                    this.redChanceInput.value = redPercent;
                    this.blackChanceInput.value = remaining - redPercent;
                }
            }
            
            // Roulette-Rad neu generieren
            this.initRouletteWheel();
        };
        
        this.redChanceInput.addEventListener('change', validatePercentages);
        this.blackChanceInput.addEventListener('change', validatePercentages);
        this.greenChanceInput.addEventListener('change', validatePercentages);
    }
    
    // Gespeicherte Daten laden
    loadSavedData() {
        const savedData = this.storage.load();
        if (savedData) {
            // Einstellungen wiederherstellen
            if (savedData.settings) {
                if (savedData.settings.channel) this.channelInput.value = savedData.settings.channel;
                if (savedData.settings.startingBalance) this.startingBalanceInput.value = savedData.settings.startingBalance;
                if (savedData.settings.redChance) this.redChanceInput.value = savedData.settings.redChance;
                if (savedData.settings.blackChance) this.blackChanceInput.value = savedData.settings.blackChance;
                if (savedData.settings.greenChance) this.greenChanceInput.value = savedData.settings.greenChance;
                if (savedData.settings.redMultiplier) this.redMultiplierInput.value = savedData.settings.redMultiplier;
                if (savedData.settings.blackMultiplier) this.blackMultiplierInput.value = savedData.settings.blackMultiplier;
                if (savedData.settings.greenMultiplier) this.greenMultiplierInput.value = savedData.settings.greenMultiplier;
            }
            
            // Spielerdaten wiederherstellen
            if (savedData.players) {
                this.players = savedData.players;
                this.updatePlayerList();
            }
            
            // Spielverlauf wiederherstellen
            if (savedData.history) {
                this.history = savedData.history;
                this.updateHistory();
            }
        }
    }
    
    // Aktuelle Einstellungen speichern
    saveSettings() {
        const settingsData = {
            settings: {
                channel: this.channelInput.value.trim(),
                startingBalance: parseInt(this.startingBalanceInput.value),
                redChance: parseInt(this.redChanceInput.value),
                blackChance: parseInt(this.blackChanceInput.value),
                greenChance: parseInt(this.greenChanceInput.value),
                redMultiplier: parseFloat(this.redMultiplierInput.value),
                blackMultiplier: parseFloat(this.blackMultiplierInput.value),
                greenMultiplier: parseFloat(this.greenMultiplierInput.value)
            },
            players: this.players,
            history: this.history
        };
        
        this.storage.save(settingsData);
    }
    
    // Roulette-Rad initialisieren
    initRouletteWheel() {
        // Aktuelle Werte abrufen
        this.redChance = parseInt(this.redChanceInput.value);
        this.blackChance = parseInt(this.blackChanceInput.value);
        this.greenChance = parseInt(this.greenChanceInput.value);
        this.redMultiplier = parseFloat(this.redMultiplierInput.value);
        this.blackMultiplier = parseFloat(this.blackMultiplierInput.value);
        this.greenMultiplier = parseFloat(this.greenMultiplierInput.value);
        
        // Rad-Segmente erstellen
        this.segments = [];
        
        // Anzahl der Segmente berechnen
        const totalSegments = 36; // Ähnlich wie bei echtem Roulette
        const redSegments = Math.round(totalSegments * (this.redChance / 100));
        const blackSegments = Math.round(totalSegments * (this.blackChance / 100));
        const greenSegments = Math.round(totalSegments * (this.greenChance / 100));
        
        // Segmente-Typen erstellen
        for (let i = 0; i < redSegments; i++) {
            this.segments.push('red');
        }
        
        for (let i = 0; i < blackSegments; i++) {
            this.segments.push('black');
        }
        
        for (let i = 0; i < greenSegments; i++) {
            this.segments.push('green');
        }
        
        // Segmente zufällig mischen
        this.segments = Utils.shuffleArray(this.segments);
        
        // Rad im DOM rendern
        this.renderWheel();
    }
    
    // Rad im DOM rendern
    renderWheel() {
        // Wheel-Container leeren
        this.wheelSegments.innerHTML = '';
        
        // Segmente hinzufügen
        const segmentAngle = 360 / this.segments.length;
        
        this.segments.forEach((color, index) => {
            const segment = document.createElement('div');
            segment.className = `wheel-segment ${color}`;
            segment.style.transform = `rotate(${index * segmentAngle}deg)`;
            this.wheelSegments.appendChild(segment);
        });
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
                this.setGameMessage('Erfolgreich mit Twitch verbunden!', 'success');
                this.connectButton.textContent = 'Verbunden';
                this.spinWheelButton.disabled = false;
                
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
    
    // Chat-Nachricht verarbeiten
    handleChatMessage(username, message) {
        // Auf !bet-Kommando prüfen
        const betMatch = message.match(/^!bet\s+(\d+)\s+(red|black|green)$/i);
        if (!betMatch) return;
        
        // Wettbetrag und Farbe extrahieren
        const amount = parseInt(betMatch[1]);
        const color = betMatch[2].toLowerCase();
        
        // Spieler ggf. hinzufügen
        if (!this.players[username]) {
            this.players[username] = {
                balance: this.startingBalance,
                totalWon: 0,
                totalLost: 0,
                wins: 0,
                losses: 0
            };
        }
        
        // Prüfen, ob während des Drehens (keine Wetten erlaubt)
        if (this.isSpinning) {
            this.twitchChat.displaySystemMessage(`${username}, Wetten sind während des Drehens nicht möglich.`);
            return;
        }
        
        // Prüfen, ob gültiger Einsatz
        if (amount <= 0) {
            this.twitchChat.displaySystemMessage(`${username}, bitte setze einen positiven Betrag.`);
            return;
        }
        
        // Prüfen, ob ausreichend Guthaben
        if (amount > this.players[username].balance) {
            this.twitchChat.displaySystemMessage(`${username}, du hast nicht genügend Guthaben (${this.players[username].balance}).`);
            return;
        }
        
        // Prüfen, ob gültige Farbe
        if (!['red', 'black', 'green'].includes(color)) {
            this.twitchChat.displaySystemMessage(`${username}, bitte wähle red, black oder green.`);
            return;
        }
        
        // Wette hinzufügen
        this.currentBets.push({
            username,
            amount,
            color
        });
        
        // Guthaben reduzieren
        this.players[username].balance -= amount;
        
        // Spielerliste aktualisieren
        this.updatePlayerList();
        
        // Bestätigung anzeigen
        this.twitchChat.displaySystemMessage(`${username} setzt ${amount} auf ${color}.`);
    }
    
    // Roulette-Rad drehen
    spinWheel() {
        // Prüfen, ob Wetten vorhanden sind
        if (this.currentBets.length === 0) {
            this.setGameMessage('Keine Wetten vorhanden. Spieler können mit !bet <Betrag> <Farbe> setzen.', 'info');
            return;
        }
        
        // Rad-Drehung starten
        this.isSpinning = true;
        this.spinWheelButton.disabled = true;
        this.setGameMessage('Rad dreht sich...', 'info');
        
        // Zufälliges Ergebnis auswählen
        const randomIndex = Utils.randomInt(0, this.segments.length - 1);
        const result = this.segments[randomIndex];
        
        // Animation starten
        const rotations = 5; // Anzahl der vollen Drehungen
        const targetAngle = 360 * rotations + (randomIndex * (360 / this.segments.length));
        
        this.wheelSegments.style.transition = 'transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)';
        this.wheelSegments.style.transform = `rotate(-${targetAngle}deg)`;
        
        // Warten, bis die Animation beendet ist
        setTimeout(() => {
            this.processResult(result);
        }, 5000);
    }
    
    // Ergebnis verarbeiten
    processResult(result) {
        this.isSpinning = false;
        this.spinWheelButton.disabled = false;
        
        // Ergebnis zur Historie hinzufügen
        this.history.push({
            result,
            timestamp: new Date().toISOString(),
            bets: this.currentBets
        });
        
        // Wetten verarbeiten
        const winners = [];
        const losers = [];
        let totalPayout = 0;
        
        this.currentBets.forEach(bet => {
            const player = this.players[bet.username];
            
            if (bet.color === result) {
                // Gewinner berechnen
                let multiplier = 1;
                if (result === 'red') multiplier = this.redMultiplier;
                else if (result === 'black') multiplier = this.blackMultiplier;
                else if (result === 'green') multiplier = this.greenMultiplier;
                
                const winAmount = Math.floor(bet.amount * multiplier);
                player.balance += winAmount;
                player.totalWon += winAmount - bet.amount;
                player.wins++;
                
                winners.push({
                    username: bet.username,
                    amount: bet.amount,
                    winAmount
                });
                
                totalPayout += winAmount;
            } else {
                // Verlierer
                player.totalLost += bet.amount;
                player.losses++;
                
                losers.push({
                    username: bet.username,
                    amount: bet.amount
                });
            }
        });
        
        // Ergebnis anzeigen
        this.setGameMessage(`Ergebnis: ${result.toUpperCase()}`, 'success');
        
        // Gewinner und Verlierer anzeigen
        if (winners.length > 0) {
            const winnersList = winners.map(w => `${w.username} (${w.amount} → ${w.winAmount})`).join(', ');
            this.twitchChat.displaySystemMessage(`Gewinner: ${winnersList}`);
        } else {
            this.twitchChat.displaySystemMessage('Keine Gewinner in dieser Runde.');
        }
        
        if (losers.length > 0) {
            const losersList = losers.map(l => `${l.username} (${l.amount})`).join(', ');
            this.twitchChat.displaySystemMessage(`Verlierer: ${losersList}`);
        }
        
        // Historie und Spielerliste aktualisieren
        this.updateHistory();
        this.updatePlayerList();
        
        // Daten speichern
        this.saveSettings();
        
        // Wetten zurücksetzen für die nächste Runde
        this.currentBets = [];
    }
    
    // Historie aktualisieren
    updateHistory() {
        // Historie-Container leeren
        this.historyContainer.innerHTML = '';
        
        // Letzte 20 Einträge anzeigen (neueste zuerst)
        const recentHistory = this.history.slice(-20).reverse();
        
        recentHistory.forEach(entry => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const resultIndicator = document.createElement('div');
            resultIndicator.className = `history-result ${entry.result}`;
            
            const resultText = document.createElement('div');
            resultText.textContent = entry.result.toUpperCase();
            
            // Zeit formatieren
            const date = new Date(entry.timestamp);
            const timeText = document.createElement('div');
            timeText.textContent = date.toLocaleTimeString();
            
            historyItem.appendChild(resultIndicator);
            historyItem.appendChild(resultText);
            historyItem.appendChild(timeText);
            
            this.historyContainer.appendChild(historyItem);
        });
    }
    
    // Spielerliste aktualisieren
    updatePlayerList() {
        // Spielerliste leeren
        this.playerList.innerHTML = '';
        
        // Spieler nach Guthaben sortieren (absteigend)
        const sortedPlayers = Object.entries(this.players)
            .sort(([, a], [, b]) => b.balance - a.balance);
        
        sortedPlayers.forEach(([username, player]) => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            
            const nameElement = document.createElement('div');
            nameElement.className = 'player-name';
            nameElement.textContent = username;
            
            const balanceElement = document.createElement('div');
            balanceElement.className = 'player-balance';
            if (player.balance > this.startingBalance) {
                balanceElement.classList.add('positive');
            } else if (player.balance < this.startingBalance) {
                balanceElement.classList.add('negative');
            }
            balanceElement.textContent = player.balance;
            
            const actionsElement = document.createElement('div');
            actionsElement.className = 'player-actions';
            
            // Zurücksetzen-Button
            const resetButton = document.createElement('button');
            resetButton.className = 'player-action-btn';
            resetButton.textContent = 'Zurücksetzen';
            resetButton.addEventListener('click', () => this.resetPlayer(username));
            
            // Guthaben-Button
            const addButton = document.createElement('button');
            addButton.className = 'player-action-btn';
            addButton.textContent = '+500';
            addButton.addEventListener('click', () => this.addBalance(username, 500));
            
            actionsElement.appendChild(resetButton);
            actionsElement.appendChild(addButton);
            
            playerItem.appendChild(nameElement);
            playerItem.appendChild(balanceElement);
            playerItem.appendChild(actionsElement);
            
            this.playerList.appendChild(playerItem);
        });
    }
    
    // Spieler zurücksetzen
    resetPlayer(username) {
        if (this.players[username]) {
            this.players[username].balance = this.startingBalance;
            this.updatePlayerList();
            this.saveSettings();
            this.twitchChat.displaySystemMessage(`${username}'s Guthaben wurde auf ${this.startingBalance} zurückgesetzt.`);
        }
    }
    
    // Guthaben hinzufügen
    addBalance(username, amount) {
        if (this.players[username]) {
            this.players[username].balance += amount;
            this.updatePlayerList();
            this.saveSettings();
            this.twitchChat.displaySystemMessage(`${username} erhält ${amount} zusätzliches Guthaben.`);
        }
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
                if (data.settings.channel) this.channelInput.value = data.settings.channel;
                if (data.settings.startingBalance) this.startingBalanceInput.value = data.settings.startingBalance;
                if (data.settings.redChance) this.redChanceInput.value = data.settings.redChance;
                if (data.settings.blackChance) this.blackChanceInput.value = data.settings.blackChance;
                if (data.settings.greenChance) this.greenChanceInput.value = data.settings.greenChance;
                if (data.settings.redMultiplier) this.redMultiplierInput.value = data.settings.redMultiplier;
                if (data.settings.blackMultiplier) this.blackMultiplierInput.value = data.settings.blackMultiplier;
                if (data.settings.greenMultiplier) this.greenMultiplierInput.value = data.settings.greenMultiplier;
            }
            
            // Spielerdaten wiederherstellen
            if (data.players) {
                this.players = data.players;
                this.updatePlayerList();
            }
            
            // Spielverlauf wiederherstellen
            if (data.history) {
                this.history = data.history;
                this.updateHistory();
            }
            
            // Rad neu initialisieren
            this.initRouletteWheel();
            
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
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message bet-command';
            
            const usernameSpan = document.createElement('span');
            usernameSpan.className = 'chat-username';
            usernameSpan.textContent = dummyUsername + ': ';
            
            const messageSpan = document.createElement('span');
            messageSpan.className = 'chat-text';
            messageSpan.textContent = command;
            
            messageElement.appendChild(usernameSpan);
            messageElement.appendChild(messageSpan);
            
            this.twitchChat.chatContainer.appendChild(messageElement);
            this.twitchChat.chatContainer.scrollTop = this.twitchChat.chatContainer.scrollHeight;
        }
        
        // Eingabefeld leeren
        this.manualCommandInput.value = '';
    }
}

// Spiel initialisieren, wenn das Dokument geladen ist
document.addEventListener('DOMContentLoaded', () => {
    const game = new GambaLightGame();
}); 