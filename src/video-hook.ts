import { MediaConnection } from "peerjs";
import { useCallback, useEffect, useState } from "react";

export function useRemoteStream(
    remoteMediaConnection: MediaConnection | undefined,
    localStream: MediaStream | undefined
) {
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

    // When press call or answer
    const answerRemote = useCallback(() => {
        if (!localStream) return;
        if (!!remoteMediaConnection) {
            remoteMediaConnection.answer(localStream);
        }
    }, [localStream, remoteMediaConnection]);

    return { remoteStream, answerRemote, remoteStreamError };
}

export function useLocalStream(
    localStream: MediaStream | undefined,
    callPeer: (x: MediaStream) => MediaConnection | undefined
): [MediaConnection | undefined, () => void] {
    const [localIsCallingConnection, setLocalIsCallingConnection] = useState<MediaConnection | undefined>();
    const onCallOrAnswer = useCallback(() => {
        if (localStream) {
            const remote = callPeer(localStream);
            setLocalIsCallingConnection(remote || undefined);
        }
    }, [localStream, callPeer]);
    return [localIsCallingConnection, onCallOrAnswer];
}
