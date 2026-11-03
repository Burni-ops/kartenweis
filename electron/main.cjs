const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".geojson": "application/geo+json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

let staticServer = null;
let appOrigin = null;

function startStaticServer(root) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      let pathname = decodeURIComponent(requestUrl.pathname);
      if (pathname === "/") pathname = "/index.html";

      const resolved = path.resolve(root, `.${pathname}`);
      if (!resolved.startsWith(path.resolve(root))) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }

      const send = (filePath) => {
        fs.readFile(filePath, (error, data) => {
          if (error) {
            response.writeHead(404);
            response.end("Not found");
            return;
          }
          response.writeHead(200, {
            "Content-Type":
              MIME[path.extname(filePath).toLowerCase()] ??
              "application/octet-stream",
            "Cache-Control": "no-store",
          });
          response.end(data);
        });
      };

      fs.stat(resolved, (error, stat) => {
        if (error || !stat.isFile()) {
          // SPA fallback.
          send(path.join(root, "index.html"));
          return;
        }
        send(resolved);
      });
    });

    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      staticServer = server;
      resolve(server.address().port);
    });
  });
}

async function createWindow() {
  const developmentUrl = process.env.VITE_DEV_SERVER_URL;
  let startUrl = developmentUrl;

  if (!startUrl) {
    const dist = path.join(__dirname, "..", "dist");
    const port = await startStaticServer(dist);
    startUrl = `http://127.0.0.1:${port}/`;
  }
  appOrigin = new URL(startUrl).origin;

  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    title: "Kartenweis",
    backgroundColor: "#f6f1e7",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (!appOrigin || new URL(url).origin === appOrigin) return;
    event.preventDefault();
    void shell.openExternal(url);
  });

  await window.loadURL(startUrl);
}

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const window = windows[0];
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });

  app.whenReady().then(() => {
    void createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) void createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("before-quit", () => {
    staticServer?.close();
    staticServer = null;
  });
}
