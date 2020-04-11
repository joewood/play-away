import React, { FC, useCallback, useEffect, useState, useMemo } from "react";
import { usePeerState, useReceivePeerState } from "react-peer";
import useDimensions from "react-use-dimensions";
import "./App.css";
import { MidiEvent, useActiveNotes, useMidiInputs, useMidiOutputs } from "./hooks";
import { MidiSelect, PianoInput, StatusBar } from "./midi-components";

interface RoomProps {
    sendingName: string;
    receivingName: string;
}

const Teacher: FC<RoomProps> = ({ sendingName, receivingName }) => {
    const [, sendData, , sendingConnections, errorSend] = usePeerState<MidiEvent>(
        { command: 0, note: 0, velocity: 0 },
        { brokerId: sendingName }
    );
    const [receiveData, isReceiveConnected, errorReceive] = useReceivePeerState<MidiEvent>(receivingName);

    const [pianoData, setPianoData] = useState<MidiEvent | null>(null);
    const [midiInputData, setMidiInput] = useMidiInputs();
    const [playMidiOutput, setMidiOutput] = useMidiOutputs();
    const [ref, { width }] = useDimensions();
    const onPianoInput = useCallback(
        (event: MidiEvent) => {
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
        <div className="App" ref={ref}>
            <header className="App-header">
                <a href="/">Play Away - Playing "{sendingName}"</a>
            </header>
            <MidiSelect key="select" onInputSelect={setMidiInput} onOutputSelect={setMidiOutput} />
            <div style={{ flex: "0 0 auto", pointerEvents: "none" }}>
                <p>Remote: {isReceiveConnected ? "Connected" : "Not Connected"}</p>
                <PianoInput disabled={!isReceiveConnected} width={width} activeNotes={remoteActiveNotes} />
            </div>
            <div style={{ flex: "0 0 auto" }}>
                <p>You: {sendingConnections.length > 0 ? "Sending" : "Not Sending"} </p>
                <PianoInput
                    width={width}
                    enableKeyboardShortcuts
                    onInput={onPianoInput}
                    activeNotes={midiActiveNotes}
                />
            </div>
            <StatusBar
                error={errorSend || errorReceive}
                session={`${sendingName}/${receivingName}`}
                connections={connectionNanes}
            />
        </div>
    );
};

export default Teacher;
