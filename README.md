# Twitch-Spiele Sammlung

Eine Sammlung interaktiver Spiele für Twitch-Chats, komplett ohne Serverseite oder Login. Alle Spiele können direkt im Browser gespielt werden und benötigen nur einen gültigen Twitch-Kanalnamen, um den Chat zu verbinden.

## Features

- **Keine Anmeldung nötig**: Verbinde dich ohne Twitch-Login direkt mit dem Chat.
- **Vollständig im Browser**: Reine HTML/CSS/JavaScript-Implementierung, kann auf GitHub-Pages gehostet werden.
- **Konfigurierbar**: Speichere und lade deine Einstellungen als JSON-Dateien.
- **Responsive Design**: Funktioniert auf Desktop und mobilen Geräten.

## Spiele

### 1. Zahlenschätzer (Guess the Number)

Ein Spiel, bei dem der Chat versucht, eine zufällige Zahl zu erraten.

- Der Bot denkt sich eine Zahl zwischen 1 und 100 aus (anpassbar).
- Chatter raten mit `!guess <zahl>` (z.B. `!guess 42`).
- Der Bot gibt Hinweise: "Höher!" oder "Tiefer!"
- Bei einem Treffer wird der Gewinner mit Anzahl der Versuche angezeigt.
- Highscore-Tabelle nach Anzahl der Versuche.
- Cooldown-Zeit pro User konfigurierbar.

### 2. 7TV Emote Memory

Ein Memory-Spiel mit Emotes aus 7TV.

- Lege ein 7TV Emote-Set über die Set-ID fest.
- Chatter können mit `!play` am Spiel teilnehmen.
- Spieler decken Karten mit `!memory <Koordinate>` auf (z.B. `!memory A3`).
- Spieler spielen abwechselnd und sammeln Paare.
- Beschriftete Spielfeldraster (A-F, 1-6).
- Konfigurierbare Spielfeldgröße und maximale Spieleranzahl.

### 3. Gamba Light (Mini-Roulette)

Ein einfaches Glücksspiel-Roulette für den Chat.

- Chatter wetten mit `!bet <Betrag> <Farbe>` (z.B. `!bet 100 red`).
- Drei mögliche Farben: red, black, green mit anpassbaren Wahrscheinlichkeiten.
- Konfigurierbare Multiplikatoren für jede Farbe.
- Jeder Chatter erhält ein Startguthaben.
- Speicherbare Spielerkonten und -stände.
- Animiertes Roulette-Rad für visuelle Darstellung.

## Installation und Hosting

1. Lade dieses Repository herunter oder klone es.
2. Hoste die Dateien auf einem beliebigen Webserver oder GitHub Pages.
3. Öffne die index.html im Browser.
4. Keine weiteren Abhängigkeiten oder Server-Setup erforderlich!

## Verwendung

1. Wähle ein Spiel aus dem Hauptmenü.
2. Gib den Namen eines Twitch-Kanals ein und verbinde dich.
3. Konfiguriere die Spieleinstellungen nach Wunsch.
4. Starte das Spiel und lasse den Chat teilnehmen!

## Technische Details

- Verwendet TMI.js für die anonyme Verbindung zum Twitch-Chat.
- Lokale Speicherung von Einstellungen über localStorage.
- Konfigurationen können als JSON-Dateien heruntergeladen und wieder hochgeladen werden.

## Konfigurierbare Einstellungen

Jedes Spiel bietet verschiedene Einstellungsmöglichkeiten:

### Zahlenschätzer
- Minimale und maximale Zahl
- Cooldown-Zeit pro Benutzer

### 7TV Emote Memory
- 7TV Emote-Set ID
- Maximale Spieleranzahl
- Spielfeldgröße (4x4, 6x4, 6x6, 8x6)

### Gamba Light
- Startguthaben
- Wahrscheinlichkeiten für die Farben
- Gewinnmultiplikatoren pro Farbe

## Anpassung und Erweiterung

Das Projekt ist modular aufgebaut und kann leicht erweitert werden. Um ein neues Spiel hinzuzufügen:

1. Erstelle einen neuen Ordner unter `/games/`
2. Implementiere die HTML, CSS und JavaScript-Dateien
3. Füge einen Eintrag in der index.html hinzu
4. Nutze die gemeinsamen Hilfsfunktionen aus main.js

## Lizenz

Frei nutzbar für persönliche und kommerzielle Projekte. 