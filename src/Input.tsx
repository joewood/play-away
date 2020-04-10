import React, { useEffect, FC, useRef, useState } from "react";
import "./App.css";

import { useReceivePeerState } from "react-peer";
import { Piano, KeyboardShortcuts, MidiNumbers } from "react-piano";
import "react-piano/dist/styles.css";
var Soundfont = require("soundfont-player");

const Input: FC<{ broker: string }> = ({ broker }) => {
    const [peerData, isConnected, error] = useReceivePeerState<{ type: string; value: number }>(broker);
    const [instrument, setInstrument] = useState<any>(null);
    const [activeNotes, setActiveNotes] = useState<number[]>([]);
    const playing = useRef<any[]>([]);

    useEffect(() => {
        var ac = new AudioContext();
        Soundfont.instrument(ac, "acoustic_grand_piano", { soundfont: "MusyngKite" }).then(function (marimba: any) {
            setInstrument(marimba);
        });
    }, []);

    const firstNote = MidiNumbers.fromNote("c3");
    const lastNote = MidiNumbers.fromNote("f5");
    const keyboardShortcuts = KeyboardShortcuts.create({
        firstNote: firstNote,
        lastNote: lastNote,
        keyboardConfig: KeyboardShortcuts.HOME_ROW,
    });
    useEffect(() => {
        if (!peerData) return;
        if (peerData?.type === "stop") {
            setActiveNotes((st) => st.filter((t) => t !== peerData.value));
        } else if (peerData.type === "play") {
            setActiveNotes((st) => [...st, peerData.value]);
        }
    }, [peerData]);
    console.log("active ", activeNotes);
    return (
        <div className="App">
            <div className="App-header">Play Away</div>
            <div style={{ flex: "1 1 auto" }}>
                {!isConnected ? <p>Connecting...</p> : <p>Playing {activeNotes.join(",")}</p>}
            </div>
            <div style={{ flexGrow: 1 }}>
                <Piano
                    noteRange={{ first: firstNote, last: lastNote }}
                    activeNotes={activeNotes}
                    playNote={(midiNumber: number) => {
                        console.log("Midi " + midiNumber);
                        playing.current[midiNumber] = instrument.play(midiNumber);

                        // Play a given note - see notes below
                    }}
                    stopNote={(midiNumber: number) => {
                        if (playing.current && playing.current[midiNumber]) playing.current[midiNumber].stop();

                        // Stop playing a given note - see notes below
                    }}
                    width={1000}
                    keyboardShortcuts={keyboardShortcuts}
                />
            </div>
        </div>
    );
};

export default Input;
