const { app, shell, BrowserWindow, Tray, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const storage = require("electron-json-storage");
const contextMenu = require("electron-context-menu");

const isDev = !app.isPackaged;

contextMenu({
  showSaveImageAs: true,
});

if (!app.requestSingleInstanceLock()) {
  console.log("Already instance running, quitting");
  app.quit();
} else {
  app.whenReady().then(() => {
    console.log("Launching window");

    win = new BrowserWindow({
      frame: false,
      backgroundColor: "#222",
      minWidth: 600,
      minHeight: 300,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        preload: path.join(__dirname, "preload.js"),
      },
    });

    app.on("second-instance", () => {
      console.log("Another instance tried to launch");
      if (!win.isVisible()) win.show();
      if (win.isMinimized()) win.restore();
      win.focus();
    });

    const contents = win.webContents;

    contents.on(
      "did-fail-load",
      (event, errorCode, errorDescription, validatedURL) => {
        if (validatedURL == "http://localhost:3000/") {
          win.loadFile("build/index.html");
        } else {
          throw new Error(
            `Could not load URL ${validatedURL}: ${errorCode} ${errorDescription}`
          );
        }
      }
    );

    contents.on("will-navigate", (event, url) => {
      if (new URL(contents.getURL()).origin != new URL(url).origin) {
        console.log("Opening url in external browser:", url);
        event.preventDefault();
        shell.openExternal(url);
      } else {
        console.log("Loading URL:", url);
      }
    });

    contents.on("new-window", (event, url) => {
      if (new URL(contents.getURL()).origin != new URL(url).origin) {
        console.log("Opening url in external browser:", url);
        event.preventDefault();
        shell.openExternal(url);
      } else {
        event.preventDefault();
        console.log("Loading URL:", url);
      }
    });

    if (isDev) {
      win.loadURL("http://localhost:3000/");
      console.log("Loading URL: http://localhost:3000/");
    } else {
      win.loadFile("build/index.html");
      console.log("Loading URL: build/index.html");
    }
  });
}
