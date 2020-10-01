const { app, shell } = require("electron");
const { BrowserWindow } = require("electron-acrylic-window");
const path = require("path");
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

    let acrylicOptions = {
      theme: "#222222cc",
      effect: "acrylic",
      useCustomWindowRefreshMethod: false,
      disableOnBlur: false,
    };

    win = new BrowserWindow({
      minWidth: 600,
      minHeight: 300,
      frame: false,
      vibrancy: process.platform == "win32" ? acrylicOptions : "window",
      darkTheme: true,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        scrollBounce: true,
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
        console.log("Loading URL:", url);
      }
    });

    if (isDev) {
      win.loadURL("http://localhost:3000/");
      console.log("Loading URL: http://localhost:3000/");
    } else {
      win.loadFile("build/index.html");
      console.log("Loading file: build/index.html");
    }
  });
}
