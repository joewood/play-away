// const { PeerServer } = require("peer");

let n = 0;
function genClient() {
    return "ROOM-" + n++;
}

const port = process.env.PORT || 9000;
console.log("Running PeerJS on " + port);

const express = require("express");
const { ExpressPeerServer } = require("./peerjs/src");

const app = express();

app.get("/", (req, res, next) => res.send("Play Away"));

const server = app.listen(port);

const peerServer = ExpressPeerServer(server, {
    debug: true,
    port: port,
    path: "/playaway",
    allow_discovery: true,
    alive_timeout: 10000,
    generateClientId: genClient,
});

app.use("/peerjs", peerServer);

peerServer.on("connection", (client) => {
    console.log("Connected " + client.getId());
});

peerServer.on("disconnect", (client) => {
    console.log("Disconnected " + client.getId());
});
