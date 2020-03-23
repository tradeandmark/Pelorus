const unhandled = require("electron-unhandled");
unhandled();

const { app, shell, BrowserWindow, Tray, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const ewc = require("ewc");
const storage = require("electron-json-storage");

const isDev = !app.isPackaged;

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

var win = null;

if (!app.requestSingleInstanceLock()) {
  console.log("Already instance running, quitting");
  app.quit();
} else {
  app.whenReady().then(() => {
    console.log("Launching window");

    win = new BrowserWindow({
      frame: false,
      backgroundColor: "#222",
      webPreferences: { nodeIntegration: true }
    });

    app.on("second-instance", () => {
      console.log("Another instance tried to launch");
      if (!win.isVisible()) win.show();
      if (win.isMinimized()) win.restore();
      win.focus();
    });

    win.on("closed", () => {
      win = null;
    });

    app.on("window-all-closed", function() {
      if (process.platform !== "darwin") {
        app.quit();
      }
    });

    app.on("activate", function() {
      if (win === null) {
        createWindow();
      }
    });

    // if ((process.platform = "win32")) {
    //   const disableAcrylic = debounce(
    //     () => {
    //       ewc.setGradient(win, 0xff222222);
    //     },
    //     50,
    //     true
    //   );

    //   const enableAcrylic = debounce(() => {
    //     ewc.setAcrylic(win, 0xbb000000);
    //   }, 50);

    //   enableAcrylic();

    //   win.on("move", () => {
    //     disableAcrylic();
    //     enableAcrylic();
    //   });

    //   win.on("resize", () => {
    //     disableAcrylic();
    //     enableAcrylic();
    //   });
    // }

    const contents = win.webContents;

    contents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
      if (validatedURL == "http://localhost:3000/") {
        win.loadFile("build/index.html");
      } else {
        throw new Error(`Could not load URL ${validatedURL}: ${errorCode} ${errorDescription}`);
      }
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
      contents.executeJavaScript(
        `(${cssString => {
          const unhandled = require("electron-unhandled");
          unhandled();

          var win = require("electron").remote.getCurrentWindow();

          {
            const types = {
              minimize: "min",
              maximize: "max",
              restore: "restore",
              close: "close"
            };
            const colors = {
              white: "w",
              black: "k"
            };
            const sizes = {
              "1": "10",
              "1.25": "12",
              "1.5": "15",
              "1.75": "15",
              "2": "20",
              "2.25": "20",
              "2.5": "24",
              "3": "30",
              "3.5": "30"
            };

            const actions = {
              minimize: () => win.minimize(),
              maximize: () => win.maximize(),
              restore: () => (win.isFullScreen() ? win.setFullScreen(false) : win.unmaximize()),
              close: () => win.close()
            };

            let buttons = "";
            for (const type in types) {
              let icons = "";
              for (const color in colors) {
                let srcset = [];
                for (const size in sizes) {
                  srcset.push(`icons/${types[type]}-${colors[color]}-${sizes[size]}.png ${size}x`);
                }
                icons += `<img class="icon icon-${color}" srcset="${srcset + ""}" />`;
              }
              buttons += `<div class="button" id="titlebar-button-${type}">${icons}</div>`;
            }

            document.body.insertAdjacentHTML(
              "afterbegin",
              `<link rel="stylesheet" href="electron.css">
              <div id="titlebar">
                <div id="titlebar-drag"></div>
                <div id="titlebar-text">${document.title}</div>
                <div id="titlebar-buttons">${buttons}</div>
              </div>`
            );

            for (const type in actions) {
              document
                .getElementById(`titlebar-button-${type}`)
                .addEventListener("click", actions[type]);
            }

            let events = {
              "page-title-updated": () =>
                (document.getElementById("titlebar-text").innerHTML = document.title),
              "maximize, unmaximize": () =>
                document.body.classList[win.isMaximized() ? "add" : "remove"]("maximized"),
              "blur, focus": () =>
                document.body.classList[win.isFocused() ? "remove" : "add"]("blurred"),
              "enter-full-screen, leave-full-screen": () =>
                document.body.classList[win.isFullScreen() ? "add" : "remove"]("full-screen")
            };

            for (const event in events) {
              events[event]();
              event.split(", ").forEach(eventSplit => {
                win.on(eventSplit, events[event]);
                window.addEventListener("beforeunload", () => {
                  win.removeListener(eventSplit, events[event]);
                });
              });
            }
          }
        }})()`
      );
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
