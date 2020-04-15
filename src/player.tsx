import React, { memo, useCallback, useEffect, useMemo, useState, useRef } from "react";
import useDimensions from "react-use-dimensions";
import styled from "styled-components";
import { Header } from "./header";
import { MidiEvent, useActiveNotes, useMidiInputs, useMediaDevice } from "./hooks";
import { PianoInput, StatusBar } from "./midi-components";
import { usePeer } from "./usePeer";
import { Welcome } from "./welcome";

interface RoomProps {
    isReceiver: boolean;
    broker?: string;
    override: string;
    className?: string;
}

const Player = memo<RoomProps>(({ isReceiver, broker, override, className }) => {
    const [ref, { width }] = useDimensions();
    const [stream, mediaError] = useMediaDevice();
    const [
        receiveData,
        mediaStream,
        error,
        { sendData, callPeer, connections, isReceiveConnected, localPeerId },
    ] = usePeer<MidiEvent>(isReceiver, broker, { brokerId: override });
    const [pianoData, setPianoData] = useState<MidiEvent | null>(null);
    const [instrument, setInstrument] = useState("acoustic_grand_piano");
    const [midiInputData, midiInput, setMidiInput] = useMidiInputs();
    const remoteVid = useRef<HTMLVideoElement | null>(null);
    const localVid = useRef<HTMLVideoElement | null>(null);
    useEffect(() => {
        if (!!mediaStream && !!remoteVid && !!remoteVid.current) {
            mediaStream.answer(stream);
            mediaStream.on("stream", (stream) => {
                if (remoteVid.current) {
                    remoteVid.current.autoplay = true;
                    remoteVid.current.srcObject = stream;
                }
            });
        }
    }, [mediaStream, stream, remoteVid]);
    useEffect(() => {
        if (!!stream && localVid.current) {
            console.log("Connecting ", stream);
            localVid.current.autoplay = true;
            localVid.current.srcObject = stream;
        }
    }, [stream, localVid]);
    const onPianoInput = useCallback(
        (event: MidiEvent) => {
            console.log("Pisno Inpuy", event);
            sendData(event);
            setPianoData(event);
        },
        [sendData, setPianoData]
    );
    const connectionNanes = useMemo(() => connections.map((c) => c.label), [connections]);
    useEffect(() => {
        if (!!midiInputData) sendData(midiInputData);
    }, [midiInputData, sendData]);
    const onCallPeer = useCallback(() => {
        if (callPeer && stream) {
            console.log("calling peer", stream);
            const med = callPeer(stream);
            console.log("calling peer", med);
            med?.on("close", () => console.log("Close"));
            med?.on("error", (err) => console.error(err));
            med?.on("stream", (stream) => {
                const rstream = (med as any)["remoteStream"];
                console.log("Remote", rstream);
                if (remoteVid.current && stream) {
                    console.log("calling peer", stream);

                    remoteVid.current.autoplay = true;
                    remoteVid.current.srcObject = stream;
                }
            });
        }
    }, [stream, callPeer]);
    const midiActiveNotes = useActiveNotes(midiInputData, pianoData);
    const remoteActiveNotes = useActiveNotes(receiveData || null, null);
    return (
        <div className={className} ref={ref}>
            <div
                className="modal"
                style={{ visibility: isReceiveConnected || connections.length > 0 ? "collapse" : "visible" }}
            >
                <Welcome broker={localPeerId || ""} />
            </div>
            <div className="main">
                <Header
                    name={localPeerId || ""}
                    midiDevice={midiInput}
                    instrument={instrument}
                    onInputSelect={setMidiInput}
                    onInstrumentSelect={setInstrument}
                    isReceiver={isReceiver}
                    callPeer={onCallPeer}
                    broker={localPeerId || ""}
                />
                <div style={{ flex: "0 0 auto", pointerEvents: "none", marginLeft: 50, marginRight: 50 }}>
                    <p>Remote: {isReceiveConnected ? "Connected" : "Not Connected"}</p>
                    <video ref={remoteVid} width={150} height={150} />
                    <PianoInput
                        disabled={!isReceiveConnected}
                        instrumentName={instrument}
                        width={width - 100}
                        activeNotes={remoteActiveNotes}
                    />
                </div>
                <div style={{ flex: "0 0 auto", marginLeft: 5, marginRight: 5 }}>
                    <p>You: {connections.length > 0 ? "Sending" : "Not Sending"} </p>
                    <video ref={localVid} width={200} height={200} />
                    <PianoInput
                        width={width - 10}
                        enableKeyboardShortcuts
                        onInput={onPianoInput}
                        activeNotes={midiActiveNotes}
                        instrumentName={instrument}
                        disabled={!isReceiver && connections.length === 0}
                    />
                </div>
                <StatusBar error={error} session={`${localPeerId}`} connections={connectionNanes} />
            </div>
        </div>
    );
});

export default styled(Player)`
    position: relative;
    height: 100vh;
    touch-action: manipulation;
    box-sizing: border-box;
    & video {
        border: 2px solid black;
    }
    & a {
        color: rgb(224, 224, 255);
        text-decoration: none;
        font-weight: bold;
    }
    & > .main {
        display: flex;
        justify-content: space-between;
        align-items: stretch;
        flex-direction: column;
        height: 100vh;
    }

    & > .modal {
        position: absolute;
        top: 10vh;
        color: white;
        z-index: 1800;
        left: 10vw;
        box-shadow: 10px 10px 20px #888;
        background-color: rgba(0, 0, 0, 0.9);
        padding: 2vh;
        height: 76vh;
        width: 76vw;
        overflow-y: scroll;
    }
`;
