import Peer, { DataConnection, MediaConnection } from "peerjs";
import * as React from "react";
import { memo, useEffect, useRef } from "react";
import { FaPhone } from "react-icons/fa";
import styled from "styled-components";
import { MidiEvent } from "./hooks";
import { PianoInput, usePiano } from "./piano";
import { SettingsType } from "./settings";
import { useConnection } from "./use-peer";
import { useAnswerRemote, useCallRemote, useStreamFromRemoteConnection } from "./video-hook";

/** Plug a stream into a video element and play it
 * @returns Video Ref for use on a video tag
 */
export function useVideo(stream: MediaStream | undefined) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    useEffect(() => {
        if (!!stream && !!videoRef.current) {
            videoRef.current.autoplay = true;
            videoRef.current.srcObject = stream;
        }
    }, [stream, videoRef]);
    return videoRef;
}

interface VideoProps {
    width: number;
    height?: number;
    stream: MediaStream | undefined;
    muted: boolean;
}

const Video = memo<VideoProps>(({ width, stream, muted }) => {
    const remoteVid = useVideo(stream);
    return (
        <div>
            <video ref={remoteVid} width={width} muted={muted} />
        </div>
    );
});

interface ConnectionProps {
    peer: Peer | null;
    /** Media connection active if being called */
    callingConnection: MediaConnection | undefined;
    /** Midi Event from Connection (or locally from keyboard UI) */
    onMidiEvent?: (midiEvent: MidiEvent) => void;

    /** Local AV Stream (for answering) */
    localStream: MediaStream | undefined;
    /** Actual data connection - null if local */
    connection: DataConnection | null;
    /** Make a call to this connection */
    callPeer: (connection: DataConnection | null, localStream: MediaStream | undefined) => MediaConnection | undefined;
    className?: string;
    width: number;
    settings: SettingsType;
}

const _Connection = memo<ConnectionProps>(
    ({ className, peer, connection, localStream, callingConnection, callPeer, width, onMidiEvent, settings }) => {
        const isLocal = connection === null;
        // returns the stream of Midi Events - no-ops if the connection is null (local)
        const [data, isOpen, error] = useConnection<MidiEvent>(connection);
        // returns the remote AV stream - no-ops if the connection is null
        const [answeredConnection, answerCall] = useAnswerRemote(callingConnection, localStream);
        const [localIsCallingConnection, makeCall] = useCallRemote(localStream, connection, callPeer);
        const [remoteStream, remoteStreamError] = useStreamFromRemoteConnection(
            callingConnection || localIsCallingConnection
        );
        const { pianoData, ...pianoProps } = usePiano(data || null, isLocal);
        useEffect(() => {
            pianoData && onMidiEvent && onMidiEvent(pianoData);
        }, [pianoData, onMidiEvent]);
        useEffect(() => {
            data && onMidiEvent && onMidiEvent(data);
        }, [data, onMidiEvent]);

        const videoStream = isLocal ? localStream : remoteStream;

        return (
            <div className={className}>
                {videoStream && (
                    <div className="video">
                        <Video stream={videoStream} width={150} muted={isLocal} />
                    </div>
                )}
                <div className="piano">
                    <PianoInput
                        width={answeredConnection ? width - 150 - 4 : width}
                        instrumentName={settings.instrument}
                        local={!connection}
                        connected={!connection || connection.open}
                        {...pianoProps}
                    />
                </div>
                <div className="status">
                    <span>{connection ? connection.peer : peer?.id}</span>
                    <span>{connection ? connection.metadata?.name : "Me"}</span>
                    {!!connection && <span>{connection.open ? "Connection Open" : "Connection Closed"}</span>}
                    {!!peer && <span>{isOpen && !peer.disconnected ? "Signal Connected" : "Signal Disconnected"}</span>}
                    {!!error && <span>{JSON.stringify(error)}</span>}
                    {!!remoteStreamError && <span>Stream Error: {JSON.stringify(remoteStreamError)}</span>}
                    {!!localIsCallingConnection && <span>{"Calling"}</span>}
                    {!!answerCall && !!callingConnection && <button onClick={answerCall}>Answer Call</button>}
                    {!!connection && (
                        <button onClick={makeCall}>
                            Make Call
                            <FaPhone />
                        </button>
                    )}
                </div>
            </div>
        );
    }
);

export const Connection = styled(_Connection)`
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto 3rem;
    column-gap: 2px;

    & .video {
        grid-row: 1/2;
        grid-column: 1/2;
        & > video {
            border: 1px solid #aaa;
            box-shadow: 4px 4px 8px #bbb;
        }
    }
    & .piano {
        grid-row: 1/2;
        grid-column: 2/3;
        pointer-events: ${({ connection }) => (!connection ? "inherit" : "none")};
    }
    & .status {
        grid-row: 2/3;
        grid-column: 1/3;
        display: flex;
        justify-content: space-around;
        background-color: #aaa;
        align-items: center;
    }
    & button {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
        font-size: 1.5rem;
        background-color: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 0px;
        color: white;
    }
`;
