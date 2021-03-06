import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { FluentCustomizations } from "@uifabric/fluent-theme";
import { Customizer } from "office-ui-fabric-react";
// import * as serviceWorker from "./serviceWorker";

if (navigator.userAgent.toLowerCase().indexOf(" electron/") > -1) {
  // Electron-specific code
}

ReactDOM.render(
  <Customizer {...FluentCustomizations}>
    <App />
  </Customizer>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
