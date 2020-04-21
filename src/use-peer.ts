import Peer, { DataConnection, MediaConnection } from "peerjs";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface PeerError {
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

/** Connect useing PeerJS and return the active data connection
 * @param opts - use a broker override to force use of a specific peer id
 * @returns Connected state, Peer object, Data Connection, MediaConnect and error
 */
function usePeerConnection(
    opts: { brokerId: string } = { brokerId: "" }
): [boolean, Peer, DataConnection | undefined, MediaConnection | undefined, PeerError | undefined] {
    const [isOpen, setIsOpen] = useState(false);
    const [localPeer, setLocalPeer] = useState<Peer>(new Peer(opts.brokerId));
    const [localPeerId, setLocalPeerId] = useState(opts.brokerId);
    const [error, setLocalPeerError] = useState<PeerError>();
    const [remoteCallingMediaConnection, setRemoteCallingMediaConnection] = useState<MediaConnection>();
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
        setLocalPeerError(undefined);
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
                setLocalPeerError(err);
                setIsOpen(false);
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
        localPeer.off("call", setRemoteCallingMediaConnection);
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
        localPeer.on("call", setRemoteCallingMediaConnection);
        localPeer.on("close", onDestroyPeer);
        localPeer.on("connection", setConnection);
        return onDestroyPeer;
    }, [localPeer, onOpenPeer, onDestroyPeer, onError, onReconnectPeer]);
    return [isOpen, localPeer, connection, remoteCallingMediaConnection, error];
}

/** Create PeerJS connection and track connections */
export function usePeerConnections(opts: { brokerId: string } = { brokerId: "" }) {
    const [connections, setConnections] = useState<Peer.DataConnection[]>([]);
    const [isOpen, localPeer, connection, remoteCallingMediaConnection, peerError] = usePeerConnection(opts);
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
            remoteCallingMediaConnection,
            sendData,
            isOpen,
            peerError,
            connectToPeer,
            callPeer,
            removeConnection,
            localPeer,
        }),
        [
            connections,
            callPeer,
            sendData,
            remoteCallingMediaConnection,
            peerError,
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
