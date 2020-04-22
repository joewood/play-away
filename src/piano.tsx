import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { KeyboardShortcuts, MidiNumbers, Piano } from "react-piano";
import "react-piano/dist/styles.css";
import Soundfont from "soundfont-player";
import styled from "styled-components";
import { MidiEvent, PLAY, STOP, useActiveNotes } from "./hooks";

/** Return the Props for the piano
 * @param stream Video or Audio Stram for this Piano
 * @param inputData Either the remote midi event or local midi event
 * @param name Friendly name playing the Piano
 * @param local True if this is a local Piano
 * @param sendData Optional function to send the data
 */
export function usePiano(inputData: MidiEvent | null, local = true) {
    const [pianoData, setPianoData] = useState<MidiEvent | null>(null);
    const onInput = useCallback(
        (event: MidiEvent) => {
            if (!local) return;
            // sendData && sendData(event);
            setPianoData(event);
        },
        [setPianoData, local]
    );
    const activeNotes = useActiveNotes(inputData, pianoData);
    return { activeNotes, onInput, pianoData };
}

export interface PianoProps {
    /** Screen width in pixels */
    width: number;
    /** Current active playing notes */
    activeNotes?: number[];
    /** name of the instrument to play */
    instrumentName: string;
    /** Key press event */
    onInput?: (event: MidiEvent) => void;
    /** connected to the remote */
    connected: boolean;
    className?: string;
    audioContext: AudioContext | undefined;
    local: boolean;
}

const _PianoInput = memo<PianoProps>(
    ({ onInput, audioContext, connected, width, activeNotes, instrumentName, local, className }) => {
        const [instrument, setInstrument] = useState<Soundfont.Player>();
        const [lastNote, setLastNote] = useState<[number, number]>([0, 0]);
        const highestNote = MidiNumbers.fromNote("c3");
        const lowestNote = MidiNumbers.fromNote("f6");
        const playings = useRef<(Soundfont.Player | undefined)[]>([]);

        useEffect(() => {
            if (!audioContext) return;
            Soundfont.instrument(audioContext, instrumentName as any, { soundfont: "MusyngKite" }).then((instrument) =>
                setInstrument(instrument)
            );
        }, [instrumentName, setInstrument, audioContext]);
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
            (local &&
                KeyboardShortcuts.create({
                    firstNote: highestNote,
                    lastNote: lowestNote,
                    keyboardConfig: KeyboardShortcuts.HOME_ROW,
                })) ||
            undefined;
        return (
            <div className={className}>
                <Piano
                    disabled={!connected}
                    noteRange={{ first: highestNote, last: lowestNote }}
                    onPlayNoteInput={onPlayNoteInput}
                    onStopNoteInput={onStopNoteInput}
                    playNote={onPlayNote}
                    stopNote={onStopNote}
                    width={width}
                    activeNotes={activeNotes}
                    keyboardShortcuts={keyboardShortcuts}
                />
            </div>
        );
    }
);
export const PianoInput = styled(_PianoInput)`
    pointer-events: ${({ local }) => (!local ? "none" : "inherit")};
`;
