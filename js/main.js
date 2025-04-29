/**
 * Gemeinsame Funktionen für alle Spiele
 */

// Twitch Chat Integration
class TwitchChat {
    constructor(channel) {
        this.channel = channel || 'default';
        this.client = null;
        this.messageCallbacks = [];
        this.connected = false;
        this.chatContainer = null;
        this.reconnectInterval = null;
    }

    // Verbindung zum Twitch Chat herstellen
    connect(channel) {
        if (channel && channel !== this.channel) {
            this.channel = channel;
        }

        if (this.client) {
            this.disconnect();
        }

        return new Promise((resolve, reject) => {
            try {
                // TMI.js ist bereits durch Skript-Tag in HTML geladen
                if (typeof tmi !== 'undefined') {
                    this._initClient()
                        .then(resolve)
                        .catch(reject);
                } else {
                    reject(new Error('TMI.js wurde nicht gefunden. Bitte stelle sicher, dass es korrekt in der HTML-Datei eingebunden ist.'));
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Chat-Client direkt setzen (für alternative Verbindungsmethode)
    setChatClient(client) {
        this.client = client;
        this.connected = true;
    }

    _initClient() {
        return new Promise((resolve, reject) => {
            try {
                // Auf globales tmi.js-Objekt zugreifen
                if (typeof tmi === 'undefined') {
                    throw new Error('TMI.js ist nicht verfügbar.');
                }
                
                this.client = new tmi.Client({
                    connection: {
                        reconnect: true,
                        secure: true
                    },
                    channels: [this.channel]
                });

                this.client.on('message', (channel, tags, message, self) => {
                    this.messageCallbacks.forEach(callback => {
                        callback(tags.username, message, tags);
                    });

                    if (this.chatContainer) {
                        this.addMessageToContainer(tags.username, message, tags.color);
                    }
                });

                this.client.on('connected', () => {
                    console.log(`Verbunden mit Kanal: ${this.channel}`);
                    this.connected = true;
                    this.displaySystemMessage(`Verbunden mit Twitch-Chat: ${this.channel}`);
                    resolve();
                });

                this.client.on('disconnected', () => {
                    console.log('Verbindung getrennt');
                    this.connected = false;
                    this.displaySystemMessage('Twitch-Chat getrennt. Versuche erneut zu verbinden...');
                    this._autoReconnect();
                });

                this.client.connect().catch(error => {
                    console.error('Verbindungsfehler:', error);
                    this.connected = false;
                    this.displaySystemMessage('Fehler bei der Verbindung zum Twitch-Chat');
                    reject(error);
                });
            } catch (error) {
                console.error('Fehler bei der Client-Initialisierung:', error);
                reject(error);
            }
        });
    }

    _autoReconnect() {
        if (this.reconnectInterval) return;
        
        this.reconnectInterval = setInterval(() => {
            if (!this.connected) {
                this.client.connect().catch(error => {
                    console.error('Reconnect-Fehler:', error);
                });
            } else {
                clearInterval(this.reconnectInterval);
                this.reconnectInterval = null;
            }
        }, 5000);
    }

    disconnect() {
        if (this.client && this.connected) {
            this.client.disconnect();
            this.connected = false;
            if (this.reconnectInterval) {
                clearInterval(this.reconnectInterval);
                this.reconnectInterval = null;
            }
        }
    }

    // Registrieren eines Callbacks für Chat-Nachrichten
    onMessage(callback) {
        if (typeof callback === 'function') {
            this.messageCallbacks.push(callback);
        }
    }

    // Entfernen eines Callbacks
    removeCallback(callback) {
        const index = this.messageCallbacks.indexOf(callback);
        if (index !== -1) {
            this.messageCallbacks.splice(index, 1);
        }
    }

    // Chat-Container für die Anzeige von Nachrichten einrichten
    setChatContainer(element) {
        this.chatContainer = element;
    }

    // Nachricht zum Chat-Container hinzufügen
    addMessageToContainer(username, message, color) {
        if (!this.chatContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        
        const usernameSpan = document.createElement('span');
        usernameSpan.className = 'chat-username';
        usernameSpan.textContent = username + ': ';
        if (color) {
            usernameSpan.style.color = color;
        }
        
        const messageSpan = document.createElement('span');
        messageSpan.className = 'chat-text';
        messageSpan.textContent = message;
        
        messageElement.appendChild(usernameSpan);
        messageElement.appendChild(messageSpan);
        
        this.chatContainer.appendChild(messageElement);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    // Systemnachricht zum Chat-Container hinzufügen
    displaySystemMessage(message) {
        if (!this.chatContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message system-message';
        messageElement.textContent = message;
        
        this.chatContainer.appendChild(messageElement);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
}

// Speicherung von Spielständen und Konfigurationen
class GameStorage {
    constructor(gameId) {
        this.gameId = gameId;
    }

    // Daten speichern
    save(data) {
        try {
            localStorage.setItem(`game_${this.gameId}`, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            return false;
        }
    }

    // Daten laden
    load() {
        try {
            const data = localStorage.getItem(`game_${this.gameId}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Fehler beim Laden:', error);
            return null;
        }
    }

    // Daten als JSON-Datei herunterladen
    downloadConfig(data) {
        const jsonData = JSON.stringify(data || this.load(), null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.gameId}_config.json`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    // Konfiguration aus Datei hochladen
    uploadConfig(callback) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = event => {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.save(data);
                    if (callback) callback(data);
                } catch (error) {
                    console.error('Fehler beim Parsen der Datei:', error);
                    alert('Ungültiges Dateiformat');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
}

// Hilfs-Utilities
const Utils = {
    // Zufällige Ganzzahl zwischen min und max (inklusiv)
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Shuffle-Algorithmus (Fisher-Yates)
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    },
    
    // Verzögerung (Promise-basiert)
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Erstellt ein DOM-Element mit Attributen und Kindelementen
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        
        return element;
    }
}; 