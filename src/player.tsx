import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import useDimensions from "react-use-dimensions";
import styled from "styled-components";
import { Header } from "./header";
import { MidiEvent, useActiveNotes, useMidiInputs } from "./hooks";
import { PianoInput, StatusBar } from "./midi-components";
import usePeer from "./usePeer";
import { Welcome } from "./welcome";

interface RoomProps {
    isReceiver: boolean;
    broker?: string;
    override: string;
    className?: string;
}

const Player = memo<RoomProps>(({ isReceiver, broker, override, className }) => {
    const [ref, { width }] = useDimensions();
    const [receiveData, sendData, sendingConnections, isReceiveConnected, brokerId, errorReceive] = usePeer<MidiEvent>(
        isReceiver,
        broker,
        { brokerId: override }
    );
    const [pianoData, setPianoData] = useState<MidiEvent | null>(null);
    const [instrument, setInstrument] = useState("acoustic_grand_piano");
    const [midiInputData, midiInput, setMidiInput] = useMidiInputs();
    const onPianoInput = useCallback(
        (event: MidiEvent) => {
            console.log("Pisno Inpuy", event);
            sendData(event);
            setPianoData(event);
        },
        [sendData, setPianoData]
    );
    const connectionNanes = useMemo(() => sendingConnections.map((c) => c.label), [sendingConnections]);
    useEffect(() => {
        if (!!midiInputData) sendData(midiInputData);
    }, [midiInputData, sendData]);
    const midiActiveNotes = useActiveNotes(midiInputData, pianoData);
    const remoteActiveNotes = useActiveNotes(receiveData || null, null);
    return (
        <div className={className} ref={ref}>
            <div
                className="modal"
                style={{ visibility: isReceiveConnected || sendingConnections.length > 0 ? "collapse" : "visible" }}
            >
                <Welcome broker={brokerId || ""} />
            </div>
            <div className="main">
                <Header
                    name={brokerId || ""}
                    midiDevice={midiInput}
                    instrument={instrument}
                    onInputSelect={setMidiInput}
                    onInstrumentSelect={setInstrument}
                    isReceiver={isReceiver}
                    broker={brokerId || ""}
                />
                <div style={{ flex: "0 0 auto", pointerEvents: "none", marginLeft: 50, marginRight: 50 }}>
                    <p>Remote: {isReceiveConnected ? "Connected" : "Not Connected"}</p>
                    <PianoInput
                        disabled={!isReceiveConnected}
                        instrumentName={instrument}
                        width={width - 100}
                        activeNotes={remoteActiveNotes}
                    />
                </div>
                <div style={{ flex: "0 0 auto", marginLeft: 5, marginRight: 5 }}>
                    <p>You: {sendingConnections.length > 0 ? "Sending" : "Not Sending"} </p>
                    <PianoInput
                        width={width - 10}
                        enableKeyboardShortcuts
                        onInput={onPianoInput}
                        activeNotes={midiActiveNotes}
                        instrumentName={instrument}
                        disabled={!isReceiver && sendingConnections.length === 0}
                    />
                </div>
                <StatusBar error={errorReceive} session={`${brokerId}`} connections={connectionNanes} />
            </div>
        </div>
    );
});

export default styled(Player)`
    position: relative;
    height: 100vh;
    touch-action: manipulation;
    box-sizing: border-box;
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
