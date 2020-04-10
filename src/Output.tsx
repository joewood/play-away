import React, { FC, useState, useEffect, useRef } from "react";
import "./App.css";
import { usePeerState } from "react-peer";

import { Piano, KeyboardShortcuts, MidiNumbers } from "react-piano";
import "react-piano/dist/styles.css";
import useDimensions from "react-use-dimensions";
var Soundfont = require("soundfont-player");

const App: FC<{ broker: string }> = ({ broker }) => {
    const [peerData, setPeerData, brokerId, connections, error] = usePeerState<{ type: string; value: number }>(
        { type: "init", value: 0 },
        { brokerId: broker }
    );
    const [instrument, setInstrument] = useState<any>(null);
    const playing = useRef<any[]>([]);
    const firstNote = MidiNumbers.fromNote("c3");
    const lastNote = MidiNumbers.fromNote("f6");
    const keyboardShortcuts = KeyboardShortcuts.create({
        firstNote: firstNote,
        lastNote: lastNote,
        keyboardConfig: KeyboardShortcuts.HOME_ROW,
    });
    const [ref, { x, y, width }] = useDimensions();

    useEffect(() => {
        var ac = new AudioContext();
        Soundfont.instrument(ac, "acoustic_grand_piano", { soundfont: "MusyngKite" }).then(function (marimba: any) {
            setInstrument(marimba);
        });
    }, []);
    return (
        <div className="App" ref={ref}>
            <header className="App-header">
                <a href="/">Play Away - Playing "{broker}"</a>
            </header>
            <div style={{ flex: "0 0 auto" }}>
                <Piano
                    noteRange={{ first: firstNote, last: lastNote }}
                    playNote={(midiNumber: number) => {
                        setPeerData({ type: "play", value: midiNumber });
                        playing.current[midiNumber] = instrument.play(midiNumber);
                    }}
                    stopNote={(midiNumber: number) => {
                        setPeerData({ type: "stop", value: midiNumber });
                        if (playing.current && playing.current[midiNumber]) playing.current[midiNumber].stop();
                    }}
                    width={width}
                    keyboardShortcuts={keyboardShortcuts}
                />
            </div>
            <div className="status">
                {error ? <span>Error {JSON.stringify(error)}</span> : <span>Connected to {brokerId}</span>}
            </div>
        </div>
    );
};

export default App;
