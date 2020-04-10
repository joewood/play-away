import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import Input from "./Input";
const params = new URLSearchParams(document.location.search.substring(1));

const broker = params.get("broker");
const server = params.get("server");
ReactDOM.render(
    <React.StrictMode>
        {broker === null ? <App broker={server || "playaway"} /> : <Input broker={broker} />}
    </React.StrictMode>,
    document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
