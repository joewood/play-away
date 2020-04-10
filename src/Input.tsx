import React, { useEffect, FC, useRef, useState } from "react";
import "./App.css";

import { useReceivePeerState } from "react-peer";
import { Piano, KeyboardShortcuts, MidiNumbers } from "react-piano";
import "react-piano/dist/styles.css";
import useDimensions from "react-use-dimensions";

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

    const [ref, { x, y, width }] = useDimensions();

    const firstNote = MidiNumbers.fromNote("c3");
    const lastNote = MidiNumbers.fromNote("f6");
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
    return (
        <div className="App" ref={ref}>
            <div className="App-header">
                <a href="/">Play Away - Echoing "{broker}"</a>
            </div>
            <div style={{ flex: "0 0 auto" }}>
                <Piano
                    noteRange={{ first: firstNote, last: lastNote }}
                    activeNotes={activeNotes}
                    playNote={(midiNumber: number) => {
                        playing.current[midiNumber] = instrument.play(midiNumber);
                    }}
                    stopNote={(midiNumber: number) => {
                        if (playing.current && playing.current[midiNumber]) playing.current[midiNumber].stop();
                    }}
                    width={width}
                    keyboardShortcuts={keyboardShortcuts}
                />
            </div>
            <div className="status">
                {!isConnected ? (
                    <span>Connecting...</span>
                ) : (
                    <span>
                        Connected to {broker}. Playing {activeNotes.join(",")}
                    </span>
                )}
            </div>
        </div>
    );
};

export default Input;
