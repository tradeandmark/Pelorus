const { app, BrowserWindow, Tray, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");
require("electron-unhandled")();

const isDev = !app.isPackaged;

let win = null;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    console.log("Launching window");
    const {
      width,
      height,
      x,
      y
    } = (windowStateKeeper = require("electron-window-state")({
      defaultWidth: 800,
      defaultHeight: 600
    }));

    win = new BrowserWindow({
      x: x,
      y: y,
      width: width,
      height: height,
      frame: false,
      backgroundColor: "#FFF",
      webPreferences: { nodeIntegration: true }
    });

    if (isDev) {
      win.loadURL("http://localhost:3000");
      console.log("Loading URL: http://localhost:3000");
    } else {
      win.loadFile("build/index.html");
      console.log("Loading file: build/index.html");
    }

    contents = win.webContents;

    windowStateKeeper.manage(win);

    contents.on(
      "did-fail-load",
      (event, errorCode, errorDescription, validatedURL) => {
        console.error(
          `Could not load URL ${validatedURL}: ${errorCode} ${errorDescription}`
        );
      }
    );

    contents.on("did-finish-load", () => {
      console.log("Finished loading");
    });

    contents.on("will-navigate", (event, url) => {
      function domain(url) {
        var match = url.match(/(?:\/\/([^\/?#]*))/i);
        return !!match ? match[1] : "";
      }
      if (domain(contents.getURL()) != domain(url)) {
        console.log("Opening url in external browser:", url);
        event.preventDefault();
        shell.openExternal(url);
      } else {
        console.log("Loading url:", url);
        console.log("Waiting for dom ready");
      }
    });

    contents.on("new-window", (event, url) => {
      event.preventDefault();
      shell.openExternal(url);
    });

    contents.executeJavaScript(
      `document.body.insertAdjacentHTML("afterBegin", \`${fs
        .readFileSync(
          isDev
            ? "public/electron.html"
            : "resources/app.asar/build/electron.html"
        )
        .toString()}\`)`
    );
    console.log("Waiting for dom ready");
    contents.on("dom-ready", () => {
      console.log("Injecting CSS, HTML and JavaScript");
      contents.insertCSS(
        fs
          .readFileSync(
            isDev
              ? "public/electron.css"
              : "resources/app.asar/build/electron.css"
          )
          .toString()
      );
      contents
        .executeJavaScript(
          `(${() => {
            try {
              global.win = require("electron").remote.getCurrentWindow();

              document.getElementById("titlebar-text").innerHTML =
                document.title;
              win.on("page-title-updated", (event, title) => {
                document.getElementById("titlebar-text").innerHTML = title;
              });

              document
                .getElementById("titlebar-button-minimize")
                .addEventListener("click", event => {
                  win.minimize();
                });

              document
                .getElementById("titlebar-button-maximize")
                .addEventListener("click", event => {
                  win.maximize();
                });

              document
                .getElementById("titlebar-button-restore")
                .addEventListener("click", event => {
                  win.isFullScreen()
                    ? win.setFullScreen(false)
                    : win.unmaximize();
                });

              document
                .getElementById("titlebar-button-close")
                .addEventListener("click", event => {
                  win.close();
                });

              function toggleMaximized() {
                win.isMaximized()
                  ? document.body.classList.add("maximized")
                  : document.body.classList.remove("maximized");
              }
              toggleMaximized();
              win.on("maximize", toggleMaximized);
              win.on("unmaximize", toggleMaximized);

              function toggleBlurred() {
                win.isFocused()
                  ? document.body.classList.remove("blurred")
                  : document.body.classList.add("blurred");
              }
              toggleBlurred();
              win.on("blur", toggleBlurred);
              win.on("focus", toggleBlurred);

              function toggleFullScreen() {
                win.isFullScreen()
                  ? document.body.classList.add("full-screen")
                  : document.body.classList.remove("full-screen");
              }
              toggleFullScreen();
              win.on("enter-full-screen", toggleFullScreen);
              win.on("leave-full-screen", toggleFullScreen);

              window.addEventListener("beforeunload", function() {
                win.removeAllListeners();
              });
            } catch (error) {
              return error;
            }
          }})()`
        )
        .then(result => {
          if (result instanceof Error) {
            console.error(`Error in web contents: ${result}`);
          } else {
            console.log("Success");
          }
        });
    });
  });
}
