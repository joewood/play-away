import React, { FC, useState, useCallback, useMemo } from "react";
import { useReceivePeerState, usePeerState } from "react-peer";
import useDimensions from "react-use-dimensions";
import "./App.css";
import { MidiEvent, useActiveNotes, useMidiInputs, useMidiOutputs } from "./hooks";
import { MidiSelect, PianoInput, StatusBar } from "./midi-components";

const Student: FC<{ broker: string }> = ({ broker }) => {
    const teacher = broker + "-teach";
    const student = broker + "-student";
    const [peerData, isConnected, error] = useReceivePeerState<MidiEvent>(teacher);
    const [, setRemoteData, , connections, student_error] = usePeerState<MidiEvent>(
        { command: 0, note: 0, velocity: 0 },
        { brokerId: student }
    );

    const [ref, { width }] = useDimensions();
    const [midiData, setMidiInput] = useMidiInputs();
    const [pianoData, setPianoData] = useState<MidiEvent | null>(null);
    const [play, setMidiOutput] = useMidiOutputs();
    const remmoteActiveNotes = useActiveNotes(peerData || null, null);
    const midiActiveNotes = useActiveNotes(midiData, pianoData);
    const onPianoInput = useCallback(
        (event: MidiEvent) => {
            setRemoteData(event);
            setPianoData(event);
        },
        [setRemoteData, setPianoData]
    );
    const connectionNanes = useMemo(() => connections.map((c) => c.label), [connections]);

    return (
        <div className="App" ref={ref}>
            <header className="App-header">
                <a href="/">Play Away - Echoing "{broker}"</a>
            </header>
            <MidiSelect key="select" onInputSelect={setMidiInput} onOutputSelect={setMidiOutput} />

            <div style={{ flex: "0 0 auto" }}>
                <p>Remote</p>
                <PianoInput activeNotes={remmoteActiveNotes} width={width} />
            </div>
            <div style={{ flex: "0 0 auto" }}>
                <p>You: {connections.length > 0 ? "Sending" : "Not Sending"} </p>
                <PianoInput activeNotes={midiActiveNotes} onInput={onPianoInput} width={width} />
            </div>
            <StatusBar error={error || student_error} session={broker} connected={isConnected} />
        </div>
    );
};

export default Student;
