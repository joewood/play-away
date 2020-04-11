import React, { FC, useCallback, useEffect, useState, useMemo } from "react";
import { usePeerState } from "react-peer";
import useDimensions from "react-use-dimensions";
import "./App.css";
import { MidiEvent, useActiveNotes, useMidiInputs, useMidiOutputs } from "./hooks";
import { MidiSelect, PianoInput, StatusBar } from "./midi-components";

const App: FC<{ broker: string }> = ({ broker }) => {
    const [remoteData, setRemoteData, brokerId, connections, error] = usePeerState<MidiEvent>(
        { command: 0, note: 0, velocity: 0 },
        { brokerId: broker }
    );
    const [pianoData, setPianoData] = useState<MidiEvent | null>(null);
    const [midiInputData, setMidiInput] = useMidiInputs();
    const [playMidiOutput, setMidiOutput] = useMidiOutputs();
    const [ref, { width }] = useDimensions();
    const onPianoInput = useCallback(
        (event: MidiEvent) => {
            setRemoteData(event);
            setPianoData(event);
        },
        [setRemoteData, setPianoData]
    );
    const connectionNanes = useMemo(() => connections.map((c) => c.label), [connections]);
    useEffect(() => {
        if (!!midiInputData) setRemoteData(midiInputData);
    }, [midiInputData, setRemoteData]);
    const midiActiveNotes = useActiveNotes(midiInputData, pianoData);
    return (
        <div className="App" ref={ref}>
            <header className="App-header">
                <a href="/">Play Away - Playing "{broker}"</a>
            </header>
            <MidiSelect key="select" onInputSelect={setMidiInput} onOutputSelect={setMidiOutput} />
            <div style={{ flex: "0 0 auto" }}>
                <p>Remote</p>
                <PianoInput width={width} activeNotes={[]} />
            </div>
            <div style={{ flex: "0 0 auto" }}>
                <p>You</p>
                <PianoInput width={width} onInput={onPianoInput} activeNotes={midiActiveNotes} />
            </div>
            <StatusBar error={error} session={broker} connections={connectionNanes} />
        </div>
    );
};

export default App;
