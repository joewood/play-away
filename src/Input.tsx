import React, { useEffect, FC, useRef, useState } from "react";
import "./App.css";

import { useReceivePeerState } from "react-peer";
import { Piano, KeyboardShortcuts, MidiNumbers } from "react-piano";
import "react-piano/dist/styles.css";
import useDimensions from "react-use-dimensions";
import { PianoInput, MidiSelect } from "./midi-components";
import { MidiEvent, useActiveNotes, useMidiInputs, useMidiOutputs } from "./hooks";

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
                <p>Other</p>
                <PianoInput activeNotes={remmoteActiveNotes} width={width} />
            </div>
            <div style={{ flex: "0 0 auto" }}>
                <p>You</p>
                <PianoInput activeNotes={midiActiveNotes} onInput={setPianoData} width={width} />
            </div>
            <div className="status">
                {!isConnected ? (
                    <span>Connecting...</span>
                ) : (
                    <span>
                        Connected to {broker}. Playing {remmoteActiveNotes.join(",")}
                    </span>
                )}
            </div>
        </div>
    );
};

export default Input;
