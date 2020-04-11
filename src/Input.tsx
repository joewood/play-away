import React, { FC, useState } from "react";
import { useReceivePeerState } from "react-peer";
import useDimensions from "react-use-dimensions";
import "./App.css";
import { MidiEvent, useActiveNotes, useMidiInputs, useMidiOutputs } from "./hooks";
import { MidiSelect, PianoInput, StatusBar } from "./midi-components";

const Input: FC<{ broker: string }> = ({ broker }) => {
    const [peerData, isConnected, error] = useReceivePeerState<MidiEvent>(broker);
    const remmoteActiveNotes = useActiveNotes(peerData || null, null);
    const [ref, { width }] = useDimensions();
    const [midiData, setMidiInput] = useMidiInputs();
    const [pianoData, setPianoData] = useState<MidiEvent | null>(null);
    const [play, setMidiOutput] = useMidiOutputs();
    const midiActiveNotes = useActiveNotes(midiData, pianoData);

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
                <p>You</p>
                <PianoInput activeNotes={midiActiveNotes} onInput={setPianoData} width={width} />
            </div>
            <StatusBar error={error} session={broker} connected={isConnected} />
        </div>
    );
};

export default Input;
