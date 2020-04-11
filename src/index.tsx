import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import Player from "./room";
import App from "./App";
const params = new URLSearchParams(document.location.search.substring(1));

const teacher = params.get("teacher");
const student = params.get("student");
ReactDOM.render(
    <React.StrictMode>
        {teacher !== null ? (
            <Player sendingName={"TCH_" + teacher} receivingName={"STU" + teacher} />
        ) : student !== null ? (
            <Player sendingName={"STU_" + student} receivingName={"STU" + student} />
        ) : (
            <App />
        )}
    </React.StrictMode>,
    document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
