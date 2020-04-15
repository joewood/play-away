import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Peer, { DataConnection, MediaConnection } from "peerjs";

interface PeerError {
    type: string;
}

interface UsePeer<TData extends {}> {
    sendData: (data: TData) => void;
    callPeer: (stream: MediaStream) => MediaConnection | null;
    connections: DataConnection[];
    localPeerId: string;
    isReceiveConnected: boolean | undefined;
}

export const usePeer = <TData extends {}>(
    isReceiver?: boolean,
    peerBrokerId?: string,
    opts: { brokerId: string } = { brokerId: "" }
): [TData | undefined, MediaConnection | null, any, UsePeer<TData>] => {
    const [receiveData, setReceiveData] = useState<TData | undefined>(undefined);
    const [mediaConnection, setMediaConnection] = useState<MediaConnection | null>(null);
    const [isReceiveConnected, setReceiveConnected] = useState(false);
    const [localPeer] = useState<Peer>(new Peer(opts.brokerId));
    const [localPeerId, setLocalPeerId] = useState(opts.brokerId);
    const [error, setError] = useState<PeerError | undefined>(undefined);
    const [connections, setConnections] = useState<Peer.DataConnection[]>([]);
    const stateRef = useRef<TData>();
    const doConnection = useCallback(
        (connection: Peer.DataConnection) => {
            console.log("Do Connection");
            setConnections((prevState) => [...prevState, connection]);
            connection.on("open", () => {
                console.log("Connected");
                setReceiveConnected(true);
                connection.on("data", (receivedData: TData) => {
                    // We want isConnected and data to be set at the same time.
                    console.log("Data", receivedData);
                    setReceiveConnected(true);
                    setReceiveData(receivedData);
                });
            });
            connection.on("close", () => {
                console.log("Connection closed");
                setReceiveConnected(false);
            });
            connection.on("error", (err) => setError(err));
        },
        [setReceiveData, setError, setReceiveConnected]
    );
    // initialize to get an ID
    useEffect(() => {
        console.log("register Open");
        localPeer.on("open", () => {
            setLocalPeerId((brokerId) => (brokerId !== localPeer.id ? localPeer.id : brokerId));
            console.log("OPEN", localPeer.id);
        });
    }, [localPeer, setLocalPeerId]);
    // Receive Mode
    useEffect(() => {
        if (!isReceiver || !peerBrokerId || localPeerId === "") return;
        console.log(`${localPeer.id} connecting to ${peerBrokerId}`);
        const connection = localPeer.connect(peerBrokerId);
        doConnection(connection);
    }, [localPeer, isReceiver, localPeerId, doConnection, peerBrokerId]);
    // Server mode
    useEffect(() => {
        if (isReceiver || !!peerBrokerId) return;
        console.log("register connection");
        localPeer.on("connection", doConnection);
    }, [localPeer, isReceiver, peerBrokerId, doConnection]);
    // general events
    useEffect(() => {
        console.log("register error");
        // in response to these callbacks we just set the hook state which is then returned
        localPeer.on("error", setError);
        localPeer.on("call", setMediaConnection);
        return () => {
            console.log("DESTROY", localPeer.id);
            setReceiveConnected(false);
            localPeer && localPeer.destroy();
        };
    }, [localPeer]);
    // dispatch to all connected
    const sendData = useCallback(
        (newState: TData) => {
            stateRef.current = newState;
            connections.forEach((conn) => conn.send(newState));
        },
        [connections, stateRef]
    );
    const callPeer = useCallback(
        (stream: MediaStream) => {
            if (!!peerBrokerId && connections.length > 0)
                return localPeer.call(peerBrokerId, stream, { metadata: connections[0].metadata });
            else return null;
        },
        [connections, localPeer, peerBrokerId]
    );
    const usePeerReturn = useMemo<UsePeer<TData>>(
        () => ({ sendData, connections, isReceiveConnected, callPeer, localPeerId }),
        [sendData, connections, isReceiveConnected, callPeer, localPeerId]
    );
    return [receiveData, mediaConnection, error, usePeerReturn];
};
