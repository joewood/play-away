import React, { FC, useCallback, useEffect, useState } from "react";
import { usePeerState } from "react-peer";
import useDimensions from "react-use-dimensions";
import "./App.css";
import { MidiEvent, useActiveNotes, useMidiInputs, useMidiOutputs } from "./hooks";
import { MidiSelect, PianoInput } from "./midi-components";

const App: FC<{ broker: string }> = ({ broker }) => {
    const [peerData, setPeerData, brokerId, connections, error] = usePeerState<MidiEvent>(
        { command: 0, note: 0, velocity: 0 },
        { brokerId: broker }
    );
    const [pianoData, setPianoData] = useState<MidiEvent | null>(null);
    const [midiData, setMidiInput] = useMidiInputs();
    const [play, setMidiOutput] = useMidiOutputs();
    const [ref, { x, y, width }] = useDimensions();
    const onPianoInput = useCallback(
        (event: MidiEvent) => {
            setPeerData(event);
            setPianoData(event);
        },
        [setPeerData, setPianoData]
    );
    useEffect(() => {
        if (!!midiData) setPeerData(midiData);
    }, [midiData, setPeerData]);
    const midiActiveNotes = useActiveNotes(midiData, pianoData);
    return (
        <div className="App" ref={ref}>
            <header className="App-header">
                <a href="/">Play Away - Playing "{broker}"</a>
            </header>
            <MidiSelect key="select" onInputSelect={setMidiInput} onOutputSelect={setMidiOutput} />
            <div style={{ flex: "0 0 auto" }}>
                <p>Other</p>
                <PianoInput width={width} activeNotes={[]} />
            </div>
            <div style={{ flex: "0 0 auto" }}>
                <p>You</p>
                <PianoInput width={width} onInput={onPianoInput} activeNotes={midiActiveNotes} />
            </div>
            <div className="status">
                {error ? <span>Error {JSON.stringify(error)}</span> : <span>Connected to {brokerId}</span>}
            </div>
        </div>
    );
};

export default App;
