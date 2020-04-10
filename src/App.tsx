import React, { FC, useState, useEffect, useRef } from "react";
import "./App.css";
import { usePeerState } from "react-peer";

import { Piano, KeyboardShortcuts, MidiNumbers } from "react-piano";
import "react-piano/dist/styles.css";
var Soundfont = require("soundfont-player");

const App: FC<{}> = () => {
    const [peerData, setPeerData, brokerId, connections, error] = usePeerState<{ type: string; value: number }>(
        { type: "init", value: 0 },
        { brokerId: "playaway" }
    );
    const [instrument, setInstrument] = useState<any>(null);
    const playing = useRef<any[]>([]);
    const firstNote = MidiNumbers.fromNote("c3");
    const lastNote = MidiNumbers.fromNote("f5");
    const keyboardShortcuts = KeyboardShortcuts.create({
        firstNote: firstNote,
        lastNote: lastNote,
        keyboardConfig: KeyboardShortcuts.HOME_ROW,
    });
    useEffect(() => {
        var ac = new AudioContext();
        Soundfont.instrument(ac, "acoustic_grand_piano", { soundfont: "MusyngKite" }).then(function (marimba: any) {
            setInstrument(marimba);
        });
    }, []);
    return (
        <div className="App">
            <header className="App-header">
                {error && <p>Error {error}</p>}
                <p>Connect to {brokerId}</p>
            </header>
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
                width={1000}
                keyboardShortcuts={keyboardShortcuts}
            />
        </div>
    );
};

export default App;
