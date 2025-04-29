# Gamba Light - Twitch Chat Mini-Roulette

Ein interaktives Mini-Roulette-Spiel für Twitch-Streamer, das direkt im Browser läuft und mit dem Twitch-Chat interagiert.

## Features

- Direkte Twitch-Chat-Integration ohne Server
- Anpassbare Gewinnchancen und Multiplikatoren
- Spieler können mit einfachen Chat-Befehlen wetten
- Spielverlauf und Spielerstatistiken
- Speichern und Laden von Konfigurationen
- Responsive Design für alle Geräte

## So funktioniert's

### Als Streamer
1. Gib deinen Twitch-Kanalnamen ein
2. Klicke auf "Mit Twitch verbinden"
3. Sobald verbunden, kannst du das Rad drehen

### Für Zuschauer
Zuschauer können mit dem Befehl `!bet <Betrag> <Farbe>` wetten, z.B.:
- `!bet 100 red`
- `!bet 50 black`
- `!bet 25 green`

## Auf GitHub Pages hosten

1. Forke dieses Repository auf GitHub
2. Gehe zu den Repository-Einstellungen
3. Scrolle zu "GitHub Pages"
4. Wähle den "main"-Branch als Quelle
5. Klicke auf "Save"

Nach ein paar Minuten ist deine Seite unter `https://DEIN_USERNAME.github.io/REPO_NAME/` verfügbar.

## Sicherheitshinweise

Dieses Spiel verwendet das TMI.js-JavaScript-SDK, um eine anonyme Verbindung zum öffentlichen Twitch-Chat herzustellen. Dies ist eine clientseitige (im Browser) Lösung, die ohne Server funktioniert, aber folgende Einschränkungen hat:

- Es werden nur öffentliche Chat-Nachrichten gelesen
- Es können keine Nachrichten im Chat gesendet werden
- Es ist keine Authentifizierung auf deinem Twitch-Konto erforderlich

## Bekannte Probleme

Wenn die Verbindung zum Twitch-Chat fehlschlägt:
1. Stelle sicher, dass der Kanalname korrekt ist (Groß-/Kleinschreibung wird nicht beachtet)
2. Überprüfe deine Internetverbindung
3. Aktualisiere die Seite und versuche es erneut

## Technische Details

Das Spiel verwendet:
- TMI.js für die Twitch-Chat-Verbindung
- Reines JavaScript ohne Frameworks
- CSS für Animationen und Styling
- LocalStorage zur Datenspeicherung 