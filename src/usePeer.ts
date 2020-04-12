import { useEffect, useState, useRef, useCallback } from "react";
import Peer from "peerjs";

interface PeerError {
    type: string;
}

const useReceivePeerState = <TData extends {}>(
    isReceiver?: boolean,
    peerBrokerId?: string,
    opts: { brokerId: string } = { brokerId: "" }
): [TData | undefined, (data: TData) => void, Peer.DataConnection[], boolean, string | undefined, any] => {
    const [receiveData, setReceiveData] = useState<TData | undefined>(undefined);
    const [isReceiveConnected, setReceiveConnected] = useState(false);
    const [localPeer, setLocalPeer] = useState<Peer>(new Peer(opts.brokerId));
    const [brokerId, setBrokerId] = useState(opts.brokerId);
    const [error, setError] = useState<PeerError | undefined>(undefined);
    const [connections, setConnections] = useState<Peer.DataConnection[]>([]);
    const stateRef = useRef<TData>();
    const doConnection = useCallback(
        (connection: Peer.DataConnection) => {
            console.log("Do Connection");
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
            setBrokerId((brokerId) => (brokerId !== localPeer.id ? localPeer.id : brokerId));
            console.log("OPEN", localPeer.id);
        });
    }, [localPeer, setBrokerId]);
    // Receive Mode
    useEffect(() => {
        if (!isReceiver || !peerBrokerId || brokerId === "") return;
        console.log(`${localPeer.id} connecting to ${peerBrokerId}`);
        const connection = localPeer.connect(peerBrokerId);
        setConnections((prevState) => [...prevState, connection]);
        doConnection(connection);
    }, [localPeer, isReceiver, brokerId, doConnection, peerBrokerId]);
    // Server mode
    useEffect(() => {
        if (isReceiver || !!peerBrokerId) return;
        console.log("register connection");
        localPeer.on("connection", (conn) => {
            setConnections((prevState) => [...prevState, conn]);
            doConnection(conn);
        });
    }, [localPeer, isReceiver, peerBrokerId, doConnection]);
    // general events
    useEffect(() => {
        console.log("register error");

        localPeer.on("error", (err) => setError(err));
        return () => {
            console.log("DESTROY", localPeer.id);
            setReceiveConnected(false);
            localPeer && localPeer.destroy();
        };
    }, [localPeer]);
    // dispatch to all connected
    const dispatch = useCallback(
        (newState: TData) => {
            stateRef.current = newState;
            connections.forEach((conn) => conn.send(newState));
        },
        [connections, stateRef]
    );
    return [receiveData, dispatch, connections, isReceiveConnected, brokerId, error];
};

export default useReceivePeerState;
