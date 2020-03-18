const { app, shell, BrowserWindow, Tray, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const ewc = require("ewc");
const storage = require("electron-json-storage");
const unhandled = require("electron-unhandled");
unhandled();

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

if (!app.requestSingleInstanceLock()) {
  console.log("Already instance running, quitting");
  app.quit();
} else {
  app.whenReady().then(() => {
    console.log("Launching window");

    win = new BrowserWindow({
      frame: false,
      backgroundColor: "#0000",
      webPreferences: { nodeIntegration: true }
    });

    app.on("second-instance", () => {
      console.log("Another instance tried to launch");
      if (win.isMinimized()) win.restore();
      if (win.isHidden()) win.show();
      win.focus();
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
      event.preventDefault();
      shell.openExternal(url);
    });

    contents.on("did-start-loading", () => {
      contents.executeJavaScript(
        `(${(cssString, htmlString) => {
          const unhandled = require("electron-unhandled");
          unhandled();

          var win = require("electron").remote.getCurrentWindow();

          var styleSheet = document.createElement("style");
          styleSheet.type = "text/css";
          styleSheet.innerText = cssString;
          document.head.appendChild(styleSheet);

          document.body.insertAdjacentHTML("afterBegin", htmlString);

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

            Object.keys(types).forEach(type => {
              Object.keys(colors).forEach(color => {
                let srcset = [];
                Object.keys(sizes).forEach(size => {
                  srcset.push(
                    `icons/${types[type]}-${colors[color]}-${sizes[size]}.png ${size}x`
                  );
                });
                document.querySelector(
                  `#titlebar-button-${type} .icon-${color}`
                ).srcset = srcset.join(", ");
              });
            });
          }

          events = {
            "page-title-updated": () => {
              document.getElementById("titlebar-text").innerHTML =
                document.title;
            },
            "maximize unmaximize": function toggleMaximized() {
              document.body.classList[win.isMaximized() ? "add" : "remove"](
                "maximized"
              );
            },
            "blur focus": () => {
              document.body.classList[win.isFocused() ? "remove" : "add"](
                "blurred"
              );
            },
            "enter-full-screen leave-full-screen": function toggleFullScreen() {
              document.body.classList[win.isFullScreen() ? "add" : "remove"](
                "full-screen"
              );
            }
          };

          for (const event in events) {
            events[event]();
            event.split(" ").forEach(eventSplit => {
              win.on(eventSplit, events[event]);
              window.addEventListener("beforeunload", () => {
                win.removeListener(eventSplit, events[event]);
              });
            });
          }

          document
            .getElementById("titlebar-button-minimize")
            .addEventListener("click", () => {
              win.minimize();
            });

          document
            .getElementById("titlebar-button-maximize")
            .addEventListener("click", () => {
              win.maximize();
            });

          document
            .getElementById("titlebar-button-restore")
            .addEventListener("click", () => {
              win.isFullScreen() ? win.setFullScreen(false) : win.unmaximize();
            });

          document
            .getElementById("titlebar-button-close")
            .addEventListener("click", () => {
              win.close();
            });
        }})(\`${fs
          .readFileSync(path.join(__dirname, "/electron.css"))
          .toString()}\`, \`${fs
          .readFileSync(path.join(__dirname, "/electron.html"))
          .toString()}\`)`
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
