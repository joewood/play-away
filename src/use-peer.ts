import Peer, { DataConnection, MediaConnection } from "peerjs";
import { useCallback, useEffect, useMemo, useState } from "react";

interface PeerError {
    type: string;
}

const FATAL_ERRORS = [
    "invalid-id",
    "invalid-key",
    "network",
    "ssl-unavailable",
    "server-error",
    "socket-error",
    "socket-closed",
    "unavailable-id",
    "webrtc",
];

interface UsePeer<TData extends {}> {
    /** send adhoc data to all connected peers */
    sendData: (data: TData) => void;
    /** start a media call with connected peers */
    callPeer: (localStream: MediaStream) => MediaConnection | null;
    /** list all available connections */
    connections: DataConnection[];
    /** this local unique ID identifying the user */
    localPeerId: string;
    /** indicating that this peer has connected to the peerBrokerID */
    isReceiveConnected: boolean | undefined;
}

function usePeerConnection(
    opts: { brokerId: string } = { brokerId: "" }
): [boolean, Peer, DataConnection | undefined, MediaConnection | undefined, PeerError | undefined] {
    const [isOpen, setIsOpen] = useState(false);
    const [localPeer, setLocalPeer] = useState<Peer>(new Peer(opts.brokerId));
    const [localPeerId, setLocalPeerId] = useState(opts.brokerId);
    const [error, setLocalPeerError] = useState<PeerError>();
    const [remoteMediaConnection, setRemoteMediaConnection] = useState<MediaConnection>();
    const [connection, setConnection] = useState<DataConnection>();
    const [reconnect, setReconnect] = useState(0);
    // const [connections, setConnections] = useState<Peer.DataConnection[]>([]);
    // const stateRef = useRef<TData>();

    const onReconnectPeer = useCallback(() => {
        console.log("RECONNECT");
        localPeer.reconnect();
    }, [localPeer]);

    const onOpenPeer = useCallback(() => {
        setLocalPeerId((brokerId) => (brokerId !== localPeer.id ? localPeer.id : brokerId));
        setReconnect(0);
        setIsOpen(true);
        console.log("OPEN", localPeer.id);
    }, [localPeer, setLocalPeerId]);

    useEffect(() => {
        if (reconnect === 0) return;
        console.log("RECOVER", localPeerId);
        const t = setTimeout(() => {
            console.log("Recreate", localPeerId);
            // onReconnectPeer();
            setLocalPeer(new Peer(localPeerId));
        }, reconnect * 1000);
        return () => clearTimeout(t);
    }, [reconnect, setLocalPeer, onReconnectPeer, localPeerId]);

    const onError = useCallback(
        (err: PeerError) => {
            console.log("Error " + err.type);
            if (FATAL_ERRORS.includes(err.type)) {
                setReconnect(5);
            } else {
                setLocalPeerError(err);
            }
        },
        [setLocalPeerError, setReconnect]
    );
    // general events
    const onDestroyPeer = useCallback(() => {
        console.log("DESTROY", localPeer.id);
        localPeer.off("disconnected", onReconnectPeer);
        localPeer.off("open", onOpenPeer);
        localPeer.off("error", onError);
        localPeer.off("call", setRemoteMediaConnection);
        localPeer.off("close", onDestroyPeer);
        localPeer.off("connection", setConnection);
        setIsOpen(false);
        localPeer.destroy();
    }, [localPeer, onOpenPeer, onError, onReconnectPeer]);

    useEffect(() => {
        // in response to these callbacks we just set the hook state which is then returned
        localPeer.on("disconnected", onReconnectPeer);
        localPeer.on("open", onOpenPeer);
        localPeer.on("error", onError);
        localPeer.on("call", setRemoteMediaConnection);
        localPeer.on("close", onDestroyPeer);
        localPeer.on("connection", setConnection);
        return onDestroyPeer;
    }, [localPeer, onOpenPeer, onDestroyPeer, onError, onReconnectPeer]);
    return [isOpen, localPeer, connection, remoteMediaConnection, error];
}

export function usePeerConnection2(opts: { brokerId: string } = { brokerId: "" }) {
    const [connections, setConnections] = useState<Peer.DataConnection[]>([]);
    const [isOpen, localPeer, connection, remoteMediaConnection, error] = usePeerConnection(opts);
    // Track inbound connectionsServer mode - when a connection arrives register it
    useEffect(() => {
        if (!connection) return;
        setConnections((prevState) => [...prevState, connection]);
    }, [connection, setConnections]);

    // Receive Mode
    const connectToPeer = useCallback(
        (peerId: string) => {
            if (!peerId || localPeer.disconnected) return;
            const connection = localPeer.connect(peerId);
            setConnections((prevState) => [...prevState, connection]);
        },
        [localPeer, setConnections]
    );

    const callPeer = useCallback(
        (connection: DataConnection | null, localStream: MediaStream | undefined) => {
            if (!!connection?.open && localStream)
                return localPeer.call(connection.peer, localStream, { metadata: connection.metadata });
            else return undefined;
        },
        [localPeer]
    );
    const removeConnection = useCallback(
        (connection: DataConnection) => setConnections((prevState) => prevState.filter((conn) => conn !== connection)),
        [setConnections]
    );
    const sendData = useCallback(
        (newState: any) => {
            connections.forEach((conn) => conn.send(newState));
        },
        [connections]
    );

    const usePeerReturn = useMemo(
        () => ({
            connections,
            remoteMediaConnection,
            sendData,
            isOpen,
            error,
            connectToPeer,
            callPeer,
            removeConnection,
            localPeer,
        }),
        [
            connections,
            callPeer,
            sendData,
            remoteMediaConnection,
            error,
            isOpen,
            connectToPeer,
            removeConnection,
            localPeer,
        ]
    );
    return usePeerReturn;
}

export function useConnection<TData extends {}>(connection: DataConnection | null): [TData | undefined, boolean, any] {
    const [data, setData] = useState<TData>();
    const [error, setError] = useState<any>();
    const [isOpen, setIsOpen] = useState(false);

    const onOpen = useCallback(() => setIsOpen(true), [setIsOpen]);
    const unregisterConnection = useCallback(() => {
        if (!!connection) {
            connection.off("data", setData);
            connection.off("open", onOpen);
            connection.off("error", setError);
        }
    }, [connection, setData, onOpen, setError]);

    if (!!connection) {
        connection.on("open", onOpen);
        connection.on("data", setData);
        connection.on("error", setError);
        connection.on("close", unregisterConnection);
    }

    return [data, isOpen, error];
}

// export const usePeer = <TData extends {}>(
//     isReceiver?: boolean,
//     peerBrokerId?: string,
//     opts: { brokerId: string } = { brokerId: "" }
// ): [TData | undefined, MediaConnection | null, any, UsePeer<TData>] => {
//     const [receiveData, setReceiveData] = useState<TData | undefined>(undefined);
//     const [remoteMediaConnection, setRemoteMediaConnection] = useState<MediaConnection | null>(null);
//     const [isReceiveConnected, setReceiveConnected] = useState(false);
//     const [localPeer] = useState<Peer>(new Peer(opts.brokerId));
//     const [localPeerId, setLocalPeerId] = useState(opts.brokerId);
//     const [error, setLocalPeerError] = useState<PeerError | undefined>(undefined);
//     const [connections, setConnections] = useState<Peer.DataConnection[]>([]);
//     const stateRef = useRef<TData>();

//     // initialize to get an ID
//     useEffect(() => {
//         console.log("register Open");
//         localPeer.on("open", () => {
//             setLocalPeerId((brokerId) => (brokerId !== localPeer.id ? localPeer.id : brokerId));
//             console.log("OPEN", localPeer.id);
//         });
//     }, [localPeer, setLocalPeerId]);
//     // general events
//     useEffect(() => {
//         // in response to these callbacks we just set the hook state which is then returned
//         localPeer.on("error", setLocalPeerError);
//         localPeer.on("call", setRemoteMediaConnection);
//         return () => {
//             console.log("DESTROY", localPeer.id);
//             localPeer.off("error", setLocalPeerError);
//             localPeer.off("call", setRemoteMediaConnection);
//             setReceiveConnected(false);
//             localPeer && localPeer.destroy();
//         };
//     }, [localPeer]);

//     // register a connection - set it up to listen to data
//     const registerConnection = useCallback(
//         (connection: Peer.DataConnection) => {
//             console.log("Register Connection");
//             setConnections((prevState) => [...prevState, connection]);
//             connection.on("open", () => {
//                 console.log("Connected");
//                 setReceiveConnected(true);
//                 connection.on("data", (receivedData: TData) => {
//                     // We want isConnected and data to be set at the same time.
//                     console.log("Data", receivedData);
//                     setReceiveConnected(true);
//                     setReceiveData(receivedData);
//                 });
//             });
//             connection.on("close", () => {
//                 console.log("Connection closed");
//                 setConnections((prevState) => prevState.filter((conn) => conn !== connection));
//                 setReceiveConnected(false);
//             });
//             connection.on("error", (err) => setLocalPeerError(err));
//         },
//         [setReceiveData, setLocalPeerError, setReceiveConnected]
//     );
//     // Receive Mode
//     useEffect(() => {
//         if (!isReceiver || !peerBrokerId || localPeerId === "") return;
//         console.log(`${localPeer.id} connecting to ${peerBrokerId}`);
//         const connection = localPeer.connect(peerBrokerId);
//         registerConnection(connection);
//     }, [localPeer, isReceiver, localPeerId, registerConnection, peerBrokerId]);
//     // Server mode - when a connection arrives register it
//     useEffect(() => {
//         if (isReceiver || !!peerBrokerId) return;
//         console.log("register connection");
//         localPeer.on("connection", registerConnection);
//     }, [localPeer, isReceiver, peerBrokerId, registerConnection]);
//     // dispatch to all connected
//     const sendData = useCallback(
//         (newState: TData) => {
//             stateRef.current = newState;
//             connections.forEach((conn) => conn.send(newState));
//         },
//         [connections, stateRef]
//     );
//     const callPeer = useCallback(
//         (localStream: MediaStream) => {
//             if (!!peerBrokerId && connections.length > 0)
//                 return localPeer.call(peerBrokerId, localStream, { metadata: connections[0].metadata });
//             else return null;
//         },
//         [connections, localPeer, peerBrokerId]
//     );
//     const usePeerReturn = useMemo<UsePeer<TData>>(
//         () => ({ sendData, connections, isReceiveConnected, callPeer, localPeerId }),
//         [sendData, connections, isReceiveConnected, callPeer, localPeerId]
//     );
//     return [receiveData, remoteMediaConnection, error, usePeerReturn];
// };
