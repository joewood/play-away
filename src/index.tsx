import React from "react";
import ReactDOM from "react-dom";
import PlayerSizer from "./player";
import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  `;

const params = new URLSearchParams(document.location.search.substring(1));

const override = params.get("override");
const broker = params.get("broker");
ReactDOM.render(
    <React.StrictMode>
        <GlobalStyle />
        {broker !== null ? (
            <PlayerSizer isReceiver={true} override="" broker={broker} />
        ) : (
            <PlayerSizer isReceiver={false} override={override || ""} />
        )}
    </React.StrictMode>,
    document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
