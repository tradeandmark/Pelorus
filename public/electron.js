const { app, shell, BrowserWindow, Tray, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const ewc = require("ewc");
const storage = require("electron-json-storage");
const unhandled = require("electron-unhandled");
unhandled();

const isDev = !app.isPackaged;

let win = null;

function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this,
      args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

if (!app.requestSingleInstanceLock()) {
  console.log("Already instance running, quitting");
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      if (win.isHidden()) win.show();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    // console.log(process.versions.chrome);
    // console.log(process.versions.electron);

    console.log("Launching window");

    const win = new BrowserWindow({
      frame: false,
      backgroundColor: "#0000",
      webPreferences: { nodeIntegration: true }
    });

    if ((process.platform = "win32")) {
      ewc.setAcrylic(win, 0xbb000000);

      const set = debounce(() => {
        ewc.setAcrylic(win, 0xbb000000);
      }, 100);

      win.on("move", () => {
        ewc.setBlurBehind(win, 0xdd222222);
        set();
      });

      win.on("resize", () => {
        ewc.setBlurBehind(win, 0xdd222222);
        set();
      });
    }

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

    contents.on("did-finish-load", () => {
      console.log("Finished loading");
    });

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
      event.preventDefault();
      shell.openExternal(url);
    });

    contents.on("did-start-loading", () => {
      contents
        .executeJavaScript(
          `(${(cssString, htmlString) => {
            const unhandled = require("electron-unhandled");
            unhandled();

            global.win = require("electron").remote.getCurrentWindow();

            var styleSheet = document.createElement("style");
            styleSheet.type = "text/css";
            styleSheet.innerText = cssString;
            document.head.appendChild(styleSheet);

            document.body.insertAdjacentHTML("afterBegin", htmlString);

            document.getElementById("titlebar-text").innerHTML = document.title;
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
          }})(\`${fs
            .readFileSync(
              isDev
                ? "public/electron.css"
                : "resources/app.asar/build/electron.css"
            )
            .toString()}\`, \`${fs
            .readFileSync(
              isDev
                ? "public/electron.html"
                : "resources/app.asar/build/electron.html"
            )
            .toString()}\`)`
        )
        .then(result => {
          if (result instanceof Error) {
            console.error(`Error in web contents: ${result}`);
          }
        });
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
