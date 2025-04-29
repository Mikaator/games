/**
 * Gemeinsame Funktionen für alle Spiele
 */

// Twitch Chat Integration über chat.is
class TwitchChat {
    constructor(channel) {
        this.channel = channel || 'default';
        this.connected = false;
        this.chatContainer = null;
        this.iframe = null;
        this.messageCallbacks = [];
    }

    // Verbindung zum Twitch Chat herstellen
    connect(channel) {
        if (channel && channel !== this.channel) {
            this.channel = channel;
        }

        if (this.iframe) {
            this.disconnect();
        }

        return new Promise((resolve, reject) => {
            try {
                // Chat.is iframe erstellen
                this.iframe = document.createElement('iframe');
                this.iframe.style.width = '100%';
                this.iframe.style.height = '100%';
                this.iframe.style.border = 'none';
                this.iframe.style.background = 'transparent';
                
                // URL für chat.is mit dem Kanalnamen
                this.iframe.src = `https://chatis.is2511.com/v2/?channel=${this.channel}&animate=true&bots=true&size=1&font=11&show_homies=true&shadow=1`;
                
                // Event-Listener für die Nachricht, dass der Chat geladen wurde
                this.iframe.onload = () => {
                    console.log(`Chat.is für Kanal ${this.channel} geladen`);
                    this.connected = true;
                    this.displaySystemMessage(`Verbunden mit Twitch-Chat: ${this.channel}`);
                    // Speichere den Kanalnamen global für alle Spiele
                    this.saveChannelGlobal(this.channel);
                    
                    // Starte Beobachtung des iframes für neue Nachrichten
                    this._startChatObserver();
                    
                    resolve();
                };
                
                this.iframe.onerror = (error) => {
                    console.error('Fehler beim Laden des Chat.is-Frames:', error);
                    reject(error);
                };
                
                // Wenn ein Container gesetzt wurde, füge den iFrame dort ein
                if (this.chatContainer) {
                    // Container leeren
                    while (this.chatContainer.firstChild) {
                        this.chatContainer.removeChild(this.chatContainer.firstChild);
                    }
                    this.chatContainer.appendChild(this.iframe);
                }
                
            } catch (error) {
                console.error('Fehler bei der Chat-Initialisierung:', error);
                reject(error);
            }
        });
    }
    
    // Starte Beobachtung des Chats für neue Nachrichten
    _startChatObserver() {
        // Regelmäßig nach neuen Nachrichten suchen
        this.chatObserverInterval = setInterval(() => {
            try {
                // Zugriff auf den iframe-Inhalt
                if (!this.iframe || !this.iframe.contentWindow || !this.iframe.contentDocument) {
                    return; // Iframe nicht verfügbar oder nicht zugänglich
                }
                
                // Chat-Container im iframe finden
                const chatContainer = this.iframe.contentDocument.querySelector('#chat_container');
                if (!chatContainer) return;
                
                // Alle Nachrichtenelemente finden
                const messageElements = chatContainer.querySelectorAll('.chat_line');
                
                // Die letzten 5 Nachrichten prüfen (um Überflutung zu vermeiden)
                const maxMessagesToCheck = 5;
                const messagesToCheck = Array.from(messageElements).slice(-maxMessagesToCheck);
                
                for (const messageElement of messagesToCheck) {
                    // Prüfen, ob wir diese Nachricht bereits verarbeitet haben
                    if (messageElement.dataset.processed === 'true') continue;
                    
                    // Als verarbeitet markieren
                    messageElement.dataset.processed = 'true';
                    
                    // Benutzernamen extrahieren
                    const userInfo = messageElement.querySelector('.user_info');
                    if (!userInfo) continue;
                    
                    const nick = userInfo.querySelector('.nick');
                    if (!nick) continue;
                    
                    const username = nick.textContent;
                    
                    // Nachrichteninhalt extrahieren
                    const messageContent = messageElement.querySelector('.message');
                    if (!messageContent) continue;
                    
                    const message = messageContent.textContent;
                    
                    // Farbe des Benutzernamens extrahieren (falls verfügbar)
                    const color = nick.style.color || '';
                    
                    // An alle Callbacks weiterleiten
                    this.messageCallbacks.forEach(callback => {
                        callback(username, message, { color });
                    });
                }
            } catch (error) {
                console.error('Fehler beim Beobachten des Chats:', error);
            }
        }, 1000); // Alle Sekunde prüfen
    }
    
    disconnect() {
        if (this.iframe && this.connected) {
            // Chat-Beobachter stoppen
            if (this.chatObserverInterval) {
                clearInterval(this.chatObserverInterval);
                this.chatObserverInterval = null;
            }
            
            if (this.iframe.parentNode) {
                this.iframe.parentNode.removeChild(this.iframe);
            }
            this.iframe = null;
            this.connected = false;
            this.displaySystemMessage('Twitch-Chat getrennt.');
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
        // Wenn bereits verbunden, füge den iframe gleich hinzu
        if (this.connected && this.iframe) {
            // Container leeren
            while (this.chatContainer.firstChild) {
                this.chatContainer.removeChild(this.chatContainer.firstChild);
            }
            this.chatContainer.appendChild(this.iframe);
        }
    }

    // Systemnachricht anzeigen (direkt im Container neben dem iframe)
    displaySystemMessage(message) {
        if (!this.chatContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message system-message';
        messageElement.textContent = message;
        
        // Füge die Systemnachricht vor dem iframe ein, wenn vorhanden
        if (this.iframe && this.iframe.parentNode === this.chatContainer) {
            this.chatContainer.insertBefore(messageElement, this.iframe);
        } else {
            this.chatContainer.appendChild(messageElement);
        }
        
        // Nach 5 Sekunden automatisch entfernen
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 5000);
    }
    
    // Hilfsmethode, um die chat.is URL zu erzeugen
    getChatIsUrl(channel) {
        return `https://chatis.is2511.com/v2/?channel=${channel}&animate=true&bots=true&size=1&font=11&show_homies=true&shadow=1`;
    }
    
    // Methode zum Ändern des Kanals
    changeChannel(channel) {
        if (channel && channel !== this.channel) {
            this.channel = channel;
            if (this.connected && this.iframe) {
                this.iframe.src = this.getChatIsUrl(this.channel);
                this.displaySystemMessage(`Kanal gewechselt zu: ${this.channel}`);
                // Speichere den Kanalnamen global für alle Spiele
                this.saveChannelGlobal(this.channel);
            } else {
                this.connect(channel);
            }
        }
    }
    
    // Speichere den Kanalnamen global, damit alle Spiele darauf zugreifen können
    saveChannelGlobal(channel) {
        if (channel) {
            localStorage.setItem('global_twitch_channel', channel);
        }
    }
    
    // Lade den global gespeicherten Kanalnamen
    static getGlobalChannel() {
        return localStorage.getItem('global_twitch_channel') || '';
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