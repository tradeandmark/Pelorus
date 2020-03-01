const { app, BrowserWindow, Tray, Menu, shell } = require("electron");
const path = require("path");
isDev = require("electron-is-dev");

app.whenReady().then(() => {
  const { width, height, x, y } = (windowStateKeeper = require("electron-window-state")({
    defaultWidth: 800,
    defaultHeight: 600
  }));

  win = new BrowserWindow({
    x: x,
    y: y,
    width: width,
    height: height,
    frame: false,
    backgroundColor: "#222",
    webPreferences: { nodeIntegration: true }
  });

  win.loadURL(isDev ? "http://localhost:3000" : "file://" + path.join(`file://${path.join(__dirname, "../build/index.html")}`));

  windowStateKeeper.manage(win);

  win.webContents.on("will-navigate", (event, url) => {
    function domain(url) {
      var match = url.match(/(?:\/\/([^\/?#]*))/i);
      return match == null ? "" : match[1];
    }
    event.preventDefault();
    if (domain(win.webContents.getURL()) != domain(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.webContents.on("new-window", (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  var appIcon = new Tray(path.join(__dirname, "/icon.png"));

  var contextMenu = Menu.buildFromTemplate([
    {
      label: "Show App",
      click: function() {
        win.show();
      }
    },
    {
      label: "Quit",
      click: function() {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  appIcon.setContextMenu(contextMenu);

  appIcon.on("click", () => {
    win.show();
  });

  win.on("minimize", function(event) {
    win.hide();
  });

  win.webContents.on("dom-ready", () => {
    win.webContents
      .executeJavaScript(
        "(" +
          (() => {
            try {
              const remote = require("electron").remote;

              var win = remote.getCurrentWindow();

              win.on("page-title-updated", (event, title) => {
                document.getElementById("titlebar-text").innerHTML = title;
              });

              document.getElementById("titlebar-text").innerHTML = document.title;

              document.getElementById("titlebar-buttons-minimize").addEventListener("click", event => {
                win.minimize();
              });

              document.getElementById("titlebar-buttons-maximize").addEventListener("click", event => {
                win.maximize();
              });

              document.getElementById("titlebar-buttons-restore").addEventListener("click", event => {
                if (win.isFullScreen()) {
                  win.setFullScreen(false);
                } else {
                  win.unmaximize();
                }
              });

              document.getElementById("titlebar-buttons-close").addEventListener("click", event => {
                win.close();
              });

              toggleMaximized();
              win.on("maximize", toggleMaximized);
              win.on("unmaximize", toggleMaximized);

              function toggleMaximized() {
                if (win.isMaximized()) {
                  document.body.classList.add("maximized");
                } else {
                  document.body.classList.remove("maximized");
                }
              }

              toggleBlurred();
              win.on("blur", toggleBlurred);
              win.on("focus", toggleBlurred);

              function toggleBlurred() {
                if (win.isFocused()) {
                  document.body.classList.remove("blurred");
                } else {
                  document.body.classList.add("blurred");
                }
              }

              toggleFullScreen();
              win.on("enter-full-screen", toggleFullScreen);
              win.on("leave-full-screen", toggleFullScreen);

              function toggleFullScreen() {
                if (win.isFullScreen()) {
                  document.body.classList.add("full-screen");
                } else {
                  document.body.classList.remove("full-screen");
                }
              }
            } catch (error) {
              return error;
            }
          }).toString() +
          ")()"
      )
      .then(result => {
        if (result) {
          if (result instanceof Error) {
            console.error(result);
            app.quit();
          }
        }
      });
  });
});
