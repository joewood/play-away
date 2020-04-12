import React, { FC, memo, useCallback, useEffect, useRef, useState } from "react";
import { KeyboardShortcuts, MidiNumbers, Piano } from "react-piano";
import "react-piano/dist/styles.css";
import Soundfont from "soundfont-player";
import styled from "styled-components";
import { MidiEvent, PLAY, STOP, useMidi } from "./hooks";

const _StatusBar: FC<{
    error?: any;
    session?: string;
    connected?: boolean;
    connections?: string[];
    className?: string;
}> = ({ error, connected, connections, session, className }) => {
    const webMidi = useMidi();
    return (
        <div className={className}>
            <span>Web Midi Supported: {webMidi === undefined ? "Waiting" : webMidi === null ? "No" : "Enabled"}</span>
            {!!error && <span style={{ color: "red" }}>Error: {JSON.stringify(error)}</span>}
            {!!session && <span>{`Session: ${session}`}</span>}
            {connected !== undefined && <span>{`Connected: ${connected}`}</span>}
            {!!connections && <span>{`Connections: ${connections.join(",")}`}</span>}
        </div>
    );
};
export const StatusBar = styled(_StatusBar)`
    background-color: #aaa;
    padding: 6px;
    flex: 0 0 auto;
    & > span {
        margin-right: 17px;
    }
`;

interface PianoProps {
    /** Screen width in pixels */
    width: number;
    /** Current active playing notes */
    activeNotes?: number[];
    /** name of the instrument to play */
    instrumentName: string;
    /** Disable and grey out the piano */
    disabled?: boolean;
    /** Overlay keyboard shortcuts and use keyboard */
    enableKeyboardShortcuts?: boolean;
    /** Key press event */
    onInput?: (event: MidiEvent) => void;
}
export const PianoInput = memo<PianoProps>(
    ({ onInput, width, activeNotes, disabled = false, instrumentName, enableKeyboardShortcuts = false }) => {
        const [instrument, setInstrument] = useState<Soundfont.Player>();
        const [lastNote, setLastNote] = useState<[number, number]>([0, 0]);
        const highestNote = MidiNumbers.fromNote("c3");
        const lowestNote = MidiNumbers.fromNote("f6");
        const playings = useRef<(Soundfont.Player | undefined)[]>([]);

        useEffect(() => {
            const AudioContext =
                window.AudioContext || // Default
                (window as any).webkitAudioContext || // Safari and old versions of Chrome
                false;
            if (!AudioContext) return;
            const audioContext = new AudioContext();
            Soundfont.instrument(audioContext, instrumentName as any, { soundfont: "MusyngKite" }).then((instrument) =>
                setInstrument(instrument)
            );
        }, [instrumentName, setInstrument]);
        useEffect(() => {
            if (!!onInput) onInput({ command: lastNote[0], note: lastNote[1], velocity: 100 });
        }, [lastNote, onInput]);
        const onStopNoteInput = useCallback(
            (midiNumber: number) => {
                setLastNote((prev) => (prev[0] === STOP && prev[1] === midiNumber ? prev : [STOP, midiNumber]));
            },
            [setLastNote]
        );
        const onPlayNoteInput = useCallback(
            (midiNumber: number) => {
                setLastNote((prev) => (prev[0] === PLAY && prev[1] === midiNumber ? prev : [PLAY, midiNumber]));
            },
            [setLastNote]
        );
        const onPlayNote = useCallback(
            (midiNumber: number) => {
                playings.current[midiNumber] = instrument?.play(midiNumber as any);
            },
            [playings, instrument]
        );
        const onStopNote = useCallback(
            (midiNumber: number) => {
                const playing = playings.current[midiNumber];
                if (!!playing) playing.stop();
            },
            [playings]
        );
        const keyboardShortcuts =
            (enableKeyboardShortcuts &&
                KeyboardShortcuts.create({
                    firstNote: highestNote,
                    lastNote: lowestNote,
                    keyboardConfig: KeyboardShortcuts.HOME_ROW,
                })) ||
            undefined;
        return (
            <Piano
                disabled={disabled}
                noteRange={{ first: highestNote, last: lowestNote }}
                onPlayNoteInput={onPlayNoteInput}
                onStopNoteInput={onStopNoteInput}
                playNote={onPlayNote}
                stopNote={onStopNote}
                width={width}
                activeNotes={activeNotes}
                keyboardShortcuts={keyboardShortcuts}
            />
        );
    }
);
