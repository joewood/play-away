import { MediaConnection, DataConnection } from "peerjs";
import { useCallback, useEffect, useState } from "react";

/** Hook that returns a answered connection from a calling connection
 * @param remoteMediaConnection Connection that is being actively called
 * @param localStream Stream of the local AV
 * @returns Answered Connection, function to answer and error
 */
export function useAnswerRemote(
    remoteMediaConnection: MediaConnection | undefined,
    localStream: MediaStream | undefined
): [MediaConnection | undefined, () => void] {
    const [answeredConnection, setAnsweredConnection] = useState<MediaConnection | undefined>();

    // When press call or answer
    const answerCall = useCallback(() => {
        if (!localStream || !remoteMediaConnection) {
            setAnsweredConnection(undefined);
        } else {
            remoteMediaConnection.answer(localStream);
            setAnsweredConnection(remoteMediaConnection);
        }
    }, [localStream, remoteMediaConnection]);

    return [answeredConnection, answerCall];
}

export function useStreamFromRemoteConnection(
    remoteMediaConnection: MediaConnection | undefined
): [MediaStream | undefined, any] {
    const [remoteStream, setRemoteStream] = useState<MediaStream | undefined>();
    const [remoteStreamError, setRemoteStreamError] = useState<any>(null);
    const onCloseStream = useCallback(() => setRemoteStream(undefined), [setRemoteStream]);
    const onErrorStream = useCallback((err) => setRemoteStreamError(err), [setRemoteStreamError]);
    const onRemoteStream = useCallback((stream) => setRemoteStream(stream), [setRemoteStream]);
    // when a remote media connection is active then plug the stream into the video
    useEffect(() => {
        if (!!remoteMediaConnection) {
            remoteMediaConnection.on("close", onCloseStream);
            remoteMediaConnection.on("error", onErrorStream);
            remoteMediaConnection.on("stream", onRemoteStream);
        }
        return () => {
            if (!!remoteMediaConnection) {
                remoteMediaConnection.off("close", onCloseStream);
                remoteMediaConnection.off("error", onErrorStream);
                remoteMediaConnection.off("stream", onRemoteStream);
            }
        };
    }, [remoteMediaConnection, onCloseStream, onErrorStream, onRemoteStream]);

    return [remoteStream, remoteStreamError];
}

/** Hook to return a function to make a call on a connection to a peer.
 * @param localStream - local AV stream to call with
 * @param connection - data connection to peer - or null if this is local then NOP
 */
export function useCallRemote(
    localStream: MediaStream | undefined,
    connection: DataConnection | null,
    callPeer: (connection: DataConnection, x: MediaStream) => MediaConnection | undefined
): [MediaConnection | undefined, () => void] {
    const [localIsCallingConnection, setLocalIsCallingConnection] = useState<MediaConnection | undefined>();
    const onCallOrAnswer = useCallback(() => {
        if (localStream && !!connection) {
            const remote = callPeer(connection, localStream);
            setLocalIsCallingConnection(remote);
        } else {
            setLocalIsCallingConnection(undefined);
        }
    }, [connection, localStream, callPeer]);
    return [localIsCallingConnection, onCallOrAnswer];
}
