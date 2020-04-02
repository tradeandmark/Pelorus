const unhandled = require("electron-unhandled");
unhandled();

var win = require("electron").remote.getCurrentWindow();

function lightOrDark(color) {
  var r, g, b, hsp;
  if (color.match(/^rgb/)) {
    color = color.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
    );
    r = color[1];
    g = color[2];
    b = color[3];
  } else {
    color = +("0x" + color.slice(1).replace(color.length < 5 && /./g, "$&$&"));
    r = color >> 16;
    g = (color >> 8) & 255;
    b = color & 255;
  }
  hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
  if (hsp > 127.5) {
    return "light";
  } else {
    return "dark";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const types = ["minimize", "maximize", "restore", "close"];

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
    restore: () =>
      win.isFullScreen() ? win.setFullScreen(false) : win.unmaximize(),
    close: () => win.close()
  };

  let buttons = "";
  for (const type in types) {
    let icons = "";
    let srcset = [];
    for (const size in sizes) {
      srcset.push(`icons/${type}-${sizes[size]}.png ${size}x`);
    }
    srcset = srcset.join(", ");
    icons += `<img class="icon" srcset="${srcset}" />`;
    buttons += `<div class="button" id="titlebar-button-${type}">${icons}</div>`;
  }

  document.body.insertAdjacentHTML(
    "afterbegin",
    `<div id="titlebar" class="theme-dark">
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

  const events = {
    "page-title-updated": () =>
      (document.getElementById("titlebar-text").innerText = document.title),
    "maximize, unmaximize": () =>
      document.body.classList[win.isMaximized() ? "add" : "remove"](
        "maximized"
      ),
    "blur, focus": () =>
      document.body.classList[win.isFocused() ? "remove" : "add"]("blurred"),
    "enter-full-screen, leave-full-screen": () =>
      document.body.classList[win.isFullScreen() ? "add" : "remove"](
        "full-screen"
      )
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
});
