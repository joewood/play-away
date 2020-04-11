import React, { FC, useRef, useCallback, useState, useEffect, EventHandler, FormEvent, FormEventHandler } from "react";
import { useMidi, MidiEvent, PLAY, STOP } from "./hooks";
import { Piano, KeyboardShortcuts, MidiNumbers } from "react-piano";
import "react-piano/dist/styles.css";
var Soundfont = require("soundfont-player");

interface MidiSelectProps {
    onInputSelect?: (inputs: WebMidi.MIDIInput[]) => void;
    onOutputSelect?: (outputs: WebMidi.MIDIOutput[]) => void;
}

export const MidiSelect: FC<MidiSelectProps> = ({ onInputSelect, onOutputSelect }) => {
    const webMidi = useMidi();
    const [input, setInput] = useState<WebMidi.MIDIInput[]>([]);
    const [output, setOutput] = useState<WebMidi.MIDIOutput[]>([]);
    const onInputChange = useCallback<FormEventHandler<HTMLSelectElement>>(
        (event) => {
            if (!webMidi) return;
            const opts = Array.from(event.currentTarget.selectedOptions).map((v) => v.value);
            setInput(webMidi.inputs.filter((i) => opts.includes(i.id)));
        },
        [webMidi]
    );
    const onOutputChange = useCallback<FormEventHandler<HTMLSelectElement>>(
        (event) => {
            if (!webMidi) return;
            const opts = Array.from(event.currentTarget.selectedOptions).map((v) => v.value);
            setOutput(webMidi.outputs.filter((i) => opts.includes(i.id)));
        },
        [webMidi]
    );
    useEffect(() => {
        if (!!onOutputSelect) onOutputSelect(output);
    }, [output, onOutputSelect]);
    useEffect(() => {
        if (!!onInputSelect) onInputSelect(input);
    }, [input, onInputSelect]);

    return (
        <div key="WebMidi" className="row">
            <p>
                <label>
                    <div>Input Device:</div>
                    <select onChange={onInputChange}>
                        {webMidi &&
                            webMidi.inputs.map((v, i) => (
                                <option key={i} value={v.id}>
                                    {v.name}
                                </option>
                            ))}
                    </select>
                </label>
            </p>
            <p>
                <label>
                    <div>Output Device:</div>
                    <select onChange={onOutputChange}>
                        {webMidi &&
                            webMidi.outputs.map((v, i) => (
                                <option key={i} value={v.id}>
                                    {v.name}
                                </option>
                            ))}
                    </select>
                </label>
            </p>
        </div>
    );
};

export const StatusBar: FC<{ error?: any; session?: string; connected?: boolean; connections?: string[] }> = ({
    error,
    connected,
    connections,
    session,
}) => {
    const webMidi = useMidi();
    return (
        <div className="status">
            <span>Web Midi Supported: {webMidi === undefined ? "Waiting" : webMidi === null ? "No" : "Enabled"}</span>
            {!!error && <span style={{ color: "red" }}>Error: {JSON.stringify(error)}</span>}
            {!!session && <span>{`Session: ${session}`}</span>}
            {connected !== undefined && <span>{`Connected: ${connected}`}</span>}
            {!!connections && <span>{`Connections: ${connections.join(",")}`}</span>}
        </div>
    );
};

interface PianoProps {
    width: number;
    activeNotes?: number[];
    instrumentName?: string | null;
    onInput?: (event: MidiEvent) => void;
}
export const PianoInput: FC<PianoProps> = ({
    onInput,
    width,
    activeNotes,
    instrumentName = "acoustic_grand_piano",
}) => {
    const [instrument, setInstrument] = useState<any>(null);
    const firstNote = MidiNumbers.fromNote("c3");
    const lastNote = MidiNumbers.fromNote("f6");
    const playing = useRef<any[]>([]);

    useEffect(() => {
        const AudioContext =
            window.AudioContext || // Default
            (window as any).webkitAudioContext || // Safari and old versions of Chrome
            false;
        if (!AudioContext) return;
        var ac = new AudioContext();
        Soundfont.instrument(ac, instrumentName, { soundfont: "MusyngKite" }).then(function (marimba: any) {
            setInstrument(marimba);
        });
    }, [instrumentName]);
    const onStopNoteInput = useCallback(
        (midiNumber: number) => {
            onInput && onInput({ command: STOP, note: midiNumber, velocity: 100 });
        },
        [onInput]
    );
    const onPlayNoteInput = useCallback(
        (midiNumber: number) => {
            onInput && onInput({ command: PLAY, note: midiNumber, velocity: 100 });
        },
        [onInput]
    );
    const onPlayNote = useCallback(
        (midiNumber: number) => {
            playing.current[midiNumber] = instrument.play(midiNumber);
        },
        [playing, instrument]
    );
    const onStopNote = useCallback(
        (midiNumber: number) => {
            if (playing.current && playing.current[midiNumber]) playing.current[midiNumber].stop();
        },
        [playing]
    );
    const keyboardShortcuts = KeyboardShortcuts.create({
        firstNote: firstNote,
        lastNote: lastNote,
        keyboardConfig: KeyboardShortcuts.HOME_ROW,
    });
    return (
        <Piano
            noteRange={{ first: firstNote, last: lastNote }}
            onPlayNoteInput={onPlayNoteInput}
            onStopNoteInput={onStopNoteInput}
            playNote={onPlayNote}
            stopNote={onStopNote}
            width={width}
            activeNotes={activeNotes}
            keyboardShortcuts={keyboardShortcuts}
        />
    );
};
