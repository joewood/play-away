import Peer, { DataConnection, MediaConnection } from "peerjs";
import * as React from "react";
import { memo, useCallback, useEffect, useRef } from "react";
import { FaPhone } from "react-icons/fa";
import styled from "styled-components";
import { PianoInput, usePiano } from "./piano";
import { SettingsType } from "./settings";
import { useAnswerRemote, useCallRemote, useStreamFromRemoteConnection } from "./use-media-stream";
import { MidiEvent, useMidiInputs } from "./use-midi";
import { useConnection } from "./use-peer";

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
    peer: Peer | null | undefined;
    /** Media connection active if being called */
    callingConnection: MediaConnection | undefined;
    /** Midi Event from Connection (or locally from keyboard UI) */
    onMidiEvent?: (midiEvent: MidiEvent) => void;
    /** Midi Input Device if this is a local Connection - otherwise undefined */
    midiDevice?: string | undefined;
    audioContext: AudioContext | undefined;
    /** Local AV Stream (for answering) */
    localStream: MediaStream | undefined;
    /** Actual data connection - null if local */
    connection: DataConnection | null;
    /** Make a call to this connection */
    callPeer: (connection: DataConnection | null, localStream: MediaStream | undefined) => MediaConnection | undefined;
    onRemoveConnection: (connection: DataConnection) => void;
    className?: string;
    width: number;
    disabled?: boolean;
    isConnected: boolean;
    settings: SettingsType;
}

const _Connection = memo<ConnectionProps>(
    ({
        className,
        peer,
        connection,
        audioContext,
        localStream,
        midiDevice,
        callingConnection,
        callPeer,
        onRemoveConnection,
        width,
        onMidiEvent,
        isConnected: isLocalConnected,
        disabled,
        settings,
    }) => {
        const isLocal = connection === null;
        const onClose = useCallback(() => connection && onRemoveConnection(connection), [
            connection,
            onRemoveConnection,
        ]);
        // returns the stream of Midi Events - no-ops if the connection is null (local)
        const [data, isOpen, error] = useConnection<MidiEvent>(connection, onClose);
        const [midiInputData] = useMidiInputs(midiDevice);

        const isConnected = connection ? isOpen : isLocalConnected;
        // returns the remote AV stream - no-ops if the connection is null
        const [answeredConnection, answerCall] = useAnswerRemote(callingConnection, localStream);
        const [localIsCallingConnection, makeCall] = useCallRemote(localStream, connection, callPeer);
        const [remoteStream, remoteStreamError] = useStreamFromRemoteConnection(
            callingConnection || localIsCallingConnection
        );
        const { pianoData, activeNotes, onInput } = usePiano((isLocal ? midiInputData : data) || null, isLocal);
        console.log("piano", activeNotes);
        useEffect(() => {
            pianoData && onMidiEvent && onMidiEvent(pianoData);
        }, [pianoData, onMidiEvent]);
        useEffect(() => {
            data && onMidiEvent && onMidiEvent(data);
        }, [data, onMidiEvent]);
        useEffect(() => {
            midiInputData && onMidiEvent && onMidiEvent(midiInputData);
        }, [midiInputData, onMidiEvent]);

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
                        width={videoStream ? width - 150 - 4 : width}
                        instrumentName={settings.instrument}
                        local={!connection}
                        connected={isConnected && !disabled}
                        audioContext={audioContext}
                        activeNotes={activeNotes}
                        onInput={onInput}
                    />
                </div>
                <div className="status">
                    <div className="meta">
                        <div>{isConnected ? "Connected" : "Not Connected"}</div>
                        {!!error && <div>{JSON.stringify(error)}</div>}
                        <div>{!!connection ? `${connection.peer}` : "Me"}</div>
                        {!!remoteStreamError && <div>Stream Error: {JSON.stringify(remoteStreamError)}</div>}
                    </div>
                    {!!localIsCallingConnection && <div className="pulsate">Calling</div>}
                    <div className="commands">
                        {!!answerCall && !!callingConnection && !videoStream && (
                            <button className="pulsate" onClick={answerCall}>
                                Answer <FaPhone />
                            </button>
                        )}
                        {!!connection && !callingConnection && !localIsCallingConnection && (
                            <button onClick={makeCall}>
                                Call <FaPhone />
                            </button>
                        )}
                    </div>
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
            border: 1px solid #777;
            box-shadow: 4px 4px 8px #bbb;
            align-self: center;
            justify-self: center;
        }
    }
    & .piano {
        grid-row: 1/2;
        grid-column: 2/3;
        align-self: center;
        justify-self: center;
        pointer-events: ${({ connection }) => (!connection ? "inherit" : "none")};
    }
    & .status {
        grid-row: 2/3;
        grid-column: 1/3;
        display: flex;
        justify-content: space-around;
        background-color: #eee;
        align-items: center;
        margin-top: 2px;
        > .meta {
            flex: 1 1 auto;
            > * {
                padding-right: 10px;
                display: inline-block;
            }
        }
    }
    & button {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
        font-size: 1rem;
        background-color: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 0px;
        color: black;
    }
`;
