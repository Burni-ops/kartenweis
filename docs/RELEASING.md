# Releases

Kartenweis wird über Git-Tags veröffentlicht. Der Workflow `.github/workflows/release.yml` baut den Web-Build und das Android-APK und hängt beides an die GitHub-Release-Seite.

## Release erstellen

```bash
git tag -a v0.1.0 -m "Kartenweis v0.1.0"
git push origin main --tags
```

Danach unter **GitHub → Actions → Release** den Lauf beobachten. Unter **Releases** stehen anschließend bereit:

- `kartenweis-<version>-web.zip` — statischer Web-Build für beliebiges Hosting
- `kartenweis-<version>-debug.apk` — installierbares Test-APK
- optional `kartenweis-<version>-release.apk` — signiertes Release-APK

Zusätzlich veröffentlicht die Action **Docker Image** bei jedem Push auf `main` und bei Tags ein Multi-Arch-Image:

```text
ghcr.io/burni-ops/kartenweis:latest
ghcr.io/burni-ops/kartenweis:<version>
```

Das Image kann direkt auf einem Homeserver gestartet werden:

```bash
docker run -d --name kartenweis -p 8080:80 --restart unless-stopped \
  ghcr.io/burni-ops/kartenweis:latest
```

## Desktop

Ein separates Desktop-Binary ist nicht nötig: Kartenweis ist eine installierbare PWA. Unter Chrome/Edge reicht **App installieren**. Der Service Worker aktualisiert die Web-App; die Update-Prüfung zeigt zusätzlich neue GitHub-Releases an.

## Signiertes Release-APK (optional)

Ohne Signatur baut der Workflow ein Debug-APK. Für ein echtes Release-APK diese Repository-Secrets anlegen:

| Secret | Bedeutung |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Base64-kodierte `.keystore`-Datei |
| `ANDROID_KEYSTORE_PASSWORD` | Passwort des Keystores |
| `ANDROID_KEY_ALIAS` | Key-Alias |
| `ANDROID_KEY_PASSWORD` | Passwort des Keys |

Keystore lokal erzeugen:

```bash
keytool -genkeypair -v \
  -keystore release.keystore \
  -alias kartenweis \
  -keyalg RSA -keysize 2048 -validity 10000
```

Base64 erzeugen (Linux/macOS):

```bash
base64 -w0 release.keystore > keystore.b64
```

Den Inhalt von `keystore.b64` als `ANDROID_KEYSTORE_BASE64` hinterlegen. Die Datei selbst niemals committen.

## Versionierung

- `versionName` entspricht dem Tag ohne `v` (z. B. `0.1.0`).
- `versionCode` wird aus dem Tag abgeleitet (`0.1.0` → `100`).
- Der Workflow setzt beide Werte über Gradle-Properties.

## Lokal prüfen

```bash
npm run check
npm run build
npm run android:sync
npm run android:build
```

Das lokale Debug-APK liegt unter `android/app/build/outputs/apk/debug/app-debug.apk`.

## GitHub Pages

Der Workflow `.github/workflows/deploy-web.yml` veröffentlicht den Web-Build. Einmalig im Repository:

1. **Settings → Pages**
2. **Source: GitHub Actions**

Der Basis-Pfad wird automatisch aus dem Repository-Namen gesetzt.
