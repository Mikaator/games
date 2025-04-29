/**
 * 7TV Emote Memory - Spiellogik
 */

class EmoteMemoryGame {
    constructor() {
        // Spiel-Einstellungen
        this.emoteSetId = '';
        this.maxPlayers = 10;
        this.boardSize = '6x4'; // Standard 6x4
        
        // Spielzustände
        this.emotes = [];
        this.boardCards = [];
        this.isGameActive = false;
        this.players = {}; // Spielerliste
        this.currentTurn = null; // Aktueller Spieler
        this.flippedCards = []; // Umgedrehte Karten
        this.matchedPairs = []; // Gefundene Paare
        
        // Spielfeld-Dimensionen
        this.cols = 6;
        this.rows = 4;
        
        // Warten auf nächsten Zug
        this.waitingForNextTurn = false;
        
        // Elemente im DOM referenzieren
        this.initDOMElements();
        
        // Twitch-Chat initialisieren
        this.twitchChat = new TwitchChat();
        
        // Storage für Spielstand und Konfiguration
        this.storage = new GameStorage('emote-memory');
        
        // Event-Listener hinzufügen
        this.initEventListeners();
        
        // Gespeicherte Daten laden (wenn vorhanden)
        this.loadSavedData();
    }
    
    // DOM-Elemente referenzieren
    initDOMElements() {
        // Einstellungsfelder
        this.emoteSetIdInput = document.getElementById('emote-set-id');
        this.channelInput = document.getElementById('twitch-channel');
        this.maxPlayersInput = document.getElementById('max-players');
        this.boardSizeSelect = document.getElementById('board-size');
        
        // Buttons
        this.loadEmotesButton = document.getElementById('load-emotes-btn');
        this.connectButton = document.getElementById('connect-btn');
        this.startGameButton = document.getElementById('start-game-btn');
        this.downloadConfigButton = document.getElementById('download-config-btn');
        this.uploadConfigButton = document.getElementById('upload-config-btn');
        this.sendCommandButton = document.getElementById('send-command');
        
        // Spielstatus- und Nachrichtenelemente
        this.gameMessage = document.getElementById('game-message');
        this.currentStatus = document.getElementById('current-status');
        this.memoryBoard = document.getElementById('memory-board');
        this.horizontalLabels = document.getElementById('horizontal-labels');
        this.verticalLabels = document.getElementById('vertical-labels');
        this.playerList = document.getElementById('player-list');
        this.scoreTable = document.getElementById('score-body');
        this.twitchContainer = document.getElementById('twitch-container');
        this.manualCommandInput = document.getElementById('manual-command');
    }
    
    // Event-Listener hinzufügen
    initEventListeners() {
        // Emotes laden
        this.loadEmotesButton.addEventListener('click', () => this.loadEmotes());
        
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
        
        // Spielfeldgröße ändern
        this.boardSizeSelect.addEventListener('change', () => {
            const [cols, rows] = this.boardSizeSelect.value.split('x').map(Number);
            this.cols = cols;
            this.rows = rows;
        });
    }
    
    // Gespeicherte Daten laden
    loadSavedData() {
        const savedData = this.storage.load();
        if (savedData) {
            // Einstellungen wiederherstellen
            if (savedData.settings) {
                if (savedData.settings.emoteSetId) this.emoteSetIdInput.value = savedData.settings.emoteSetId;
                if (savedData.settings.channel) this.channelInput.value = savedData.settings.channel;
                if (savedData.settings.maxPlayers) this.maxPlayersInput.value = savedData.settings.maxPlayers;
                if (savedData.settings.boardSize) this.boardSizeSelect.value = savedData.settings.boardSize;
            }
            
            // Emotes wiederherstellen (optional)
            if (savedData.emotes && savedData.emotes.length > 0) {
                this.emotes = savedData.emotes;
                this.setGameMessage('Emotes aus Speicher geladen. Du kannst nun ein Spiel starten.', 'info');
                this.startGameButton.disabled = false;
            }
        }
    }
    
    // Aktuelle Einstellungen speichern
    saveSettings() {
        const settingsData = {
            settings: {
                emoteSetId: this.emoteSetIdInput.value.trim(),
                channel: this.channelInput.value.trim(),
                maxPlayers: parseInt(this.maxPlayersInput.value),
                boardSize: this.boardSizeSelect.value
            },
            emotes: this.emotes
        };
        
        this.storage.save(settingsData);
    }
    
    // 7TV Emotes laden
    loadEmotes() {
        const emoteSetId = this.emoteSetIdInput.value.trim();
        
        if (!emoteSetId) {
            this.setGameMessage('Bitte gib eine 7TV Emote-Set ID ein.', 'error');
            return;
        }
        
        this.setGameMessage('Emotes werden geladen...', 'info');
        this.loadEmotesButton.disabled = true;
        this.loadEmotesButton.textContent = 'Lädt...';
        
        // 7TV API aufrufen
        fetch(`https://7tv.io/v3/emote-sets/${emoteSetId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Emote-Set nicht gefunden');
                }
                return response.json();
            })
            .then(data => {
                if (!data.emotes || data.emotes.length < 8) {
                    throw new Error('Nicht genügend Emotes im Set (mindestens 8 benötigt)');
                }
                
                // Emotes verarbeiten und speichern
                this.emotes = data.emotes.map(emote => ({
                    id: emote.id,
                    name: emote.name,
                    url: emote.data.host.url + '/3x.webp' // Hohe Qualität verwenden
                }));
                
                this.setGameMessage(`Erfolgreich ${this.emotes.length} Emotes geladen! Du kannst nun ein Spiel starten.`, 'success');
                this.loadEmotesButton.disabled = false;
                this.loadEmotesButton.textContent = 'Emotes laden';
                this.startGameButton.disabled = false;
                
                // Einstellungen speichern
                this.saveSettings();
            })
            .catch(error => {
                console.error('Fehler beim Laden der Emotes:', error);
                this.setGameMessage('Fehler beim Laden der Emotes: ' + error.message, 'error');
                this.loadEmotesButton.disabled = false;
                this.loadEmotesButton.textContent = 'Emotes laden';
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
        // Prüfen, ob genügend Emotes geladen sind
        const pairsNeeded = Math.floor(this.cols * this.rows / 2);
        if (this.emotes.length < pairsNeeded) {
            this.setGameMessage(`Nicht genügend Emotes für diese Spielfeldgröße. Benötigt: ${pairsNeeded}`, 'error');
            return;
        }
        
        // Spieleinstellungen aktualisieren
        this.maxPlayers = parseInt(this.maxPlayersInput.value);
        const [cols, rows] = this.boardSizeSelect.value.split('x').map(Number);
        this.cols = cols;
        this.rows = rows;
        
        // Spielstatus zurücksetzen
        this.isGameActive = true;
        this.players = {};
        this.currentTurn = null;
        this.flippedCards = [];
        this.matchedPairs = [];
        this.waitingForNextTurn = false;
        
        // Spielbrett generieren
        this.generateBoard();
        
        // Spielstart verkünden
        const message = `Neues Memory-Spiel gestartet! Spieler können mit !play beitreten. Verwende !memory A1 um eine Karte aufzudecken.`;
        this.setGameMessage(message, 'info');
        this.updateCurrentStatus();
        
        console.log('Neues Spiel gestartet.');
    }
    
    // Spielbrett generieren
    generateBoard() {
        // Zufällige Emotes auswählen
        const shuffledEmotes = Utils.shuffleArray(this.emotes);
        const pairsNeeded = Math.floor(this.cols * this.rows / 2);
        const selectedEmotes = shuffledEmotes.slice(0, pairsNeeded);
        
        // Karten erstellen (jedes Emote zweimal)
        this.boardCards = [];
        selectedEmotes.forEach(emote => {
            this.boardCards.push({
                id: emote.id + '_1',
                emoteId: emote.id,
                emoteName: emote.name,
                emoteUrl: emote.url,
                flipped: false,
                matched: false
            });
            
            this.boardCards.push({
                id: emote.id + '_2',
                emoteId: emote.id,
                emoteName: emote.name,
                emoteUrl: emote.url,
                flipped: false,
                matched: false
            });
        });
        
        // Karten mischen
        this.boardCards = Utils.shuffleArray(this.boardCards);
        
        // Spielbrett rendern
        this.renderBoard();
    }
    
    // Spielbrett rendern
    renderBoard() {
        // Board-Container leeren
        this.memoryBoard.innerHTML = '';
        this.horizontalLabels.innerHTML = '';
        this.verticalLabels.innerHTML = '';
        
        // CSS-Grid für das Spielbrett einstellen
        this.memoryBoard.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        this.memoryBoard.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
        
        // Horizontale Beschriftungen hinzufügen (A, B, C, ...)
        for (let col = 0; col < this.cols; col++) {
            const label = document.createElement('div');
            label.className = 'memory-label';
            label.textContent = String.fromCharCode(65 + col); // A, B, C, ...
            this.horizontalLabels.appendChild(label);
        }
        
        // Vertikale Beschriftungen hinzufügen (1, 2, 3, ...)
        for (let row = 0; row < this.rows; row++) {
            const label = document.createElement('div');
            label.className = 'memory-label';
            label.textContent = (row + 1).toString(); // 1, 2, 3, ...
            this.verticalLabels.appendChild(label);
        }
        
        // Karten zum Spielbrett hinzufügen
        this.boardCards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'memory-card';
            cardElement.dataset.cardId = card.id;
            cardElement.dataset.index = index;
            
            const cardInner = document.createElement('div');
            cardInner.className = 'memory-card-inner';
            
            // Kartenrückseite (Fragezeichen)
            const cardFront = document.createElement('div');
            cardFront.className = 'memory-card-front';
            cardFront.textContent = '?';
            
            // Kartenvorderseite (Emote)
            const cardBack = document.createElement('div');
            cardBack.className = 'memory-card-back';
            
            const emoteImg = document.createElement('img');
            emoteImg.src = card.emoteUrl;
            emoteImg.alt = card.emoteName;
            emoteImg.loading = 'lazy';
            
            cardBack.appendChild(emoteImg);
            cardInner.appendChild(cardFront);
            cardInner.appendChild(cardBack);
            cardElement.appendChild(cardInner);
            
            this.memoryBoard.appendChild(cardElement);
        });
    }
    
    // Spieler zum Spiel hinzufügen
    addPlayer(username) {
        // Prüfen, ob maximale Spielerzahl erreicht ist
        const currentPlayerCount = Object.keys(this.players).length;
        if (currentPlayerCount >= this.maxPlayers) {
            return false;
        }
        
        // Prüfen, ob Spieler bereits teilnimmt
        if (this.players[username]) {
            return true; // Bereits im Spiel
        }
        
        // Spieler hinzufügen
        this.players[username] = {
            score: 0,
            active: true
        };
        
        // Spielerliste aktualisieren
        this.updatePlayerList();
        
        // Wenn erster Spieler, dann als aktiver Spieler festlegen
        if (currentPlayerCount === 0) {
            this.currentTurn = username;
            this.updateCurrentStatus();
        }
        
        return true;
    }
    
    // Spielerliste aktualisieren
    updatePlayerList() {
        this.playerList.innerHTML = '';
        
        Object.entries(this.players).forEach(([username, player]) => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'player-status';
            if (username === this.currentTurn) {
                statusIndicator.classList.add('active');
            }
            
            const nameElement = document.createElement('div');
            nameElement.className = 'player-name';
            nameElement.textContent = username;
            
            playerItem.appendChild(statusIndicator);
            playerItem.appendChild(nameElement);
            
            this.playerList.appendChild(playerItem);
        });
        
        // Scoreboard aktualisieren
        this.updateScoreboard();
    }
    
    // Scoreboard aktualisieren
    updateScoreboard() {
        this.scoreTable.innerHTML = '';
        
        // Spieler nach Punkten sortieren
        const sortedPlayers = Object.entries(this.players)
            .sort(([, a], [, b]) => b.score - a.score)
            .map(([username, player]) => ({ username, score: player.score }));
        
        sortedPlayers.forEach((player, index) => {
            const row = document.createElement('tr');
            
            const placeCell = document.createElement('td');
            placeCell.textContent = index + 1;
            
            const nameCell = document.createElement('td');
            nameCell.textContent = player.username;
            
            const scoreCell = document.createElement('td');
            scoreCell.textContent = player.score;
            
            row.appendChild(placeCell);
            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            
            this.scoreTable.appendChild(row);
        });
    }
    
    // Status-Nachricht aktualisieren
    updateCurrentStatus() {
        if (!this.isGameActive) {
            this.currentStatus.textContent = 'Kein aktives Spiel.';
            return;
        }
        
        if (this.currentTurn) {
            this.currentStatus.textContent = `${this.currentTurn} ist am Zug.`;
        } else {
            this.currentStatus.textContent = 'Warte auf Spieler...';
        }
    }
    
    // Chat-Nachricht verarbeiten
    handleChatMessage(username, message) {
        if (!this.isGameActive) return;
        
        // Auf !play-Kommando prüfen (zum Spiel beitreten)
        if (message.match(/^!play$/i)) {
            const success = this.addPlayer(username);
            if (success) {
                this.twitchChat.displaySystemMessage(`${username} ist dem Spiel beigetreten!`);
            }
            return;
        }
        
        // Auf !memory-Kommando prüfen (Karte aufdecken)
        const memoryMatch = message.match(/^!memory\s+([a-z])(\d+)$/i);
        if (memoryMatch) {
            // Prüfen, ob Spieler am Spiel teilnimmt
            if (!this.players[username]) {
                // Optional: Fehlermeldung zurücksenden
                return;
            }
            
            // Prüfen, ob Spieler an der Reihe ist
            if (this.currentTurn !== username) {
                // Optional: Fehlermeldung zurücksenden
                return;
            }
            
            // Prüfen, ob noch auf Animation gewartet wird
            if (this.waitingForNextTurn) {
                return;
            }
            
            // Koordinaten der Karte ermitteln
            const col = memoryMatch[1].toUpperCase().charCodeAt(0) - 65; // A=0, B=1, ...
            const row = parseInt(memoryMatch[2]) - 1; // 1=0, 2=1, ...
            
            // Prüfen, ob Koordinaten gültig sind
            if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
                // Optional: Fehlermeldung zurücksenden
                return;
            }
            
            // Index der Karte berechnen
            const cardIndex = row * this.cols + col;
            
            // Karte aufdecken
            this.flipCard(cardIndex);
        }
    }
    
    // Karte aufdecken
    flipCard(index) {
        // Prüfen, ob Karte gültig ist
        if (index < 0 || index >= this.boardCards.length) {
            return;
        }
        
        // Karte abrufen
        const card = this.boardCards[index];
        
        // Prüfen, ob Karte bereits umgedreht oder gematched ist
        if (card.flipped || card.matched) {
            return;
        }
        
        // Karte umdrehen
        card.flipped = true;
        this.flippedCards.push(index);
        
        // Karte visuell umdrehen
        const cardElement = this.memoryBoard.querySelector(`[data-index="${index}"]`);
        if (cardElement) {
            cardElement.classList.add('flipped');
        }
        
        // Nachricht anzeigen
        const col = String.fromCharCode(65 + (index % this.cols));
        const row = Math.floor(index / this.cols) + 1;
        this.setGameMessage(`${this.currentTurn} deckt Karte ${col}${row} auf.`, 'info');
        
        // Prüfen, ob zweite Karte umgedreht wurde
        if (this.flippedCards.length === 2) {
            this.checkForMatch();
        }
    }
    
    // Prüfen, ob ein Paar gefunden wurde
    checkForMatch() {
        const index1 = this.flippedCards[0];
        const index2 = this.flippedCards[1];
        
        const card1 = this.boardCards[index1];
        const card2 = this.boardCards[index2];
        
        this.waitingForNextTurn = true;
        
        // Prüfen, ob Karten übereinstimmen
        if (card1.emoteId === card2.emoteId) {
            // Übereinstimmung gefunden!
            card1.matched = true;
            card2.matched = true;
            this.matchedPairs.push(card1.emoteId);
            
            // Spieler bekommt einen Punkt
            this.players[this.currentTurn].score++;
            
            // Karten visuell markieren
            setTimeout(() => {
                const cardElement1 = this.memoryBoard.querySelector(`[data-index="${index1}"]`);
                const cardElement2 = this.memoryBoard.querySelector(`[data-index="${index2}"]`);
                
                if (cardElement1) cardElement1.classList.add('matched');
                if (cardElement2) cardElement2.classList.add('matched');
                
                this.setGameMessage(`${this.currentTurn} hat ein Paar gefunden! (${card1.emoteName})`, 'success');
                
                // Prüfen, ob Spiel beendet ist
                if (this.matchedPairs.length === Math.floor(this.cols * this.rows / 2)) {
                    this.endGame();
                } else {
                    // Spieler darf weitermachen (gleicher Spieler bleibt am Zug)
                    this.flippedCards = [];
                    this.waitingForNextTurn = false;
                    this.updatePlayerList();
                }
            }, 1000);
        } else {
            // Keine Übereinstimmung
            setTimeout(() => {
                // Karten zurückdrehen
                card1.flipped = false;
                card2.flipped = false;
                
                const cardElement1 = this.memoryBoard.querySelector(`[data-index="${index1}"]`);
                const cardElement2 = this.memoryBoard.querySelector(`[data-index="${index2}"]`);
                
                if (cardElement1) cardElement1.classList.remove('flipped');
                if (cardElement2) cardElement2.classList.remove('flipped');
                
                this.setGameMessage(`${this.currentTurn} hat kein Paar gefunden.`, 'info');
                
                // Nächster Spieler ist an der Reihe
                this.nextTurn();
                
                this.flippedCards = [];
                this.waitingForNextTurn = false;
            }, 2000);
        }
    }
    
    // Nächster Spieler ist an der Reihe
    nextTurn() {
        const playerNames = Object.keys(this.players).filter(name => this.players[name].active);
        
        if (playerNames.length === 0) return;
        
        // Aktuellen Spieler finden
        const currentIndex = playerNames.indexOf(this.currentTurn);
        
        // Nächsten Spieler bestimmen
        const nextIndex = (currentIndex + 1) % playerNames.length;
        this.currentTurn = playerNames[nextIndex];
        
        // Status aktualisieren
        this.updateCurrentStatus();
        this.updatePlayerList();
    }
    
    // Spiel beenden
    endGame() {
        this.isGameActive = false;
        
        // Gewinner ermitteln
        let winner = null;
        let highestScore = -1;
        
        Object.entries(this.players).forEach(([username, player]) => {
            if (player.score > highestScore) {
                winner = username;
                highestScore = player.score;
            }
        });
        
        // Ergebnis verkünden
        if (winner) {
            this.setGameMessage(`Spiel beendet! ${winner} gewinnt mit ${highestScore} Paaren!`, 'success');
        } else {
            this.setGameMessage('Spiel beendet! Unentschieden!', 'info');
        }
        
        this.currentStatus.textContent = 'Spiel beendet. Starte ein neues Spiel, um weiterzuspielen.';
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
                if (data.settings.emoteSetId) this.emoteSetIdInput.value = data.settings.emoteSetId;
                if (data.settings.channel) this.channelInput.value = data.settings.channel;
                if (data.settings.maxPlayers) this.maxPlayersInput.value = data.settings.maxPlayers;
                if (data.settings.boardSize) this.boardSizeSelect.value = data.settings.boardSize;
                
                // Board-Größe aktualisieren
                const [cols, rows] = this.boardSizeSelect.value.split('x').map(Number);
                this.cols = cols;
                this.rows = rows;
            }
            
            if (data && data.emotes && data.emotes.length > 0) {
                this.emotes = data.emotes;
                this.startGameButton.disabled = false;
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
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message memory-command';
            
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
    const game = new EmoteMemoryGame();
}); 