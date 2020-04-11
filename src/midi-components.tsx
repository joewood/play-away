import React, { FC, useRef, useCallback, useState, useEffect, EventHandler, FormEvent, FormEventHandler } from "react";
import { useMidi, MidiEvent, PLAY, STOP } from "./hooks";
import { Piano, KeyboardShortcuts, MidiNumbers } from "react-piano";
import "react-piano/dist/styles.css";
import Soundfont from "soundfont-player";
import styled from "styled-components";

interface HeaderProps extends MidiSelectProps {
    name: string;
    className?: string;
}

const _Header: FC<HeaderProps> = ({ className, name, onInputSelect }) => {
    return (
        <header className={className}>
            <a href="/">/PlayAway</a>
            <div>
                <span>Play Away:</span>
                <span>{name}</span>
            </div>
            <div>
                <MidiSelect onInputSelect={onInputSelect} />
            </div>
        </header>
    );
};
export const Header = styled(_Header)`
    background-color: #282c34;
    flex: 0 0 calc(40px + 2vmin);
    display: flex;
    outline-style: solid;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    font-size: calc(10px + 2vmin);
    color: white;
    & > a {
        text-shadow: 1px 0 5px rgba(192, 192, 255, 1);
        font-size: 20px;
        color: rgb(224, 224, 255);
        text-decoration: none;
        padding: 10px;
    }
    & > div:nth-child(2) {
        padding: 2px;
        > span:first-child {
            font-weight: bold;
        }
        > span:nth-child(2) {
            font-style: italic;
        }
    }
`;

interface MidiSelectProps {
    onInputSelect?: (inputs: WebMidi.MIDIInput[]) => void;
    className?: string;
    // onOutputSelect?: (outputs: WebMidi.MIDIOutput[]) => void;
}

const _MidiSelect: FC<MidiSelectProps> = ({ onInputSelect, className }) => {
    const webMidi = useMidi();
    const [input, setInput] = useState<WebMidi.MIDIInput[]>([]);
    const onInputChange = useCallback<FormEventHandler<HTMLSelectElement>>(
        (event) => {
            if (!webMidi) return;
            const opts = Array.from(event.currentTarget.selectedOptions).map((v) => v.value);
            setInput(webMidi.inputs.filter((i) => opts.includes(i.id)));
        },
        [webMidi]
    );
    useEffect(() => {
        if (!!onInputSelect) onInputSelect(input);
    }, [input, onInputSelect]);
    // const [output, setOutput] = useState<WebMidi.MIDIOutput[]>([]);
    // const onOutputChange = useCallback<FormEventHandler<HTMLSelectElement>>(
    //     (event) => {
    //         if (!webMidi) return;
    //         const opts = Array.from(event.currentTarget.selectedOptions).map((v) => v.value);
    //         setOutput(webMidi.outputs.filter((i) => opts.includes(i.id)));
    //     },
    //     [webMidi]
    // );
    // useEffect(() => {
    //     if (!!onOutputSelect) onOutputSelect(output);
    // }, [output, onOutputSelect]);
    if (!webMidi) return <div className={className}></div>;
    return (
        <div className={className}>
            <div>Midi Input</div>
            <select onChange={onInputChange}>
                {webMidi &&
                    webMidi.inputs.map((v, i) => (
                        <option key={i} value={v.id}>
                            {v.name}
                        </option>
                    ))}
            </select>
        </div>
    );
};
const MidiSelect = styled(_MidiSelect)`
    font-size: 12px;
    padding-right: 10px;
`;

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
    /** Screen width in pixels */
    width: number;
    /** Current active playing notes */
    activeNotes?: number[];
    /** name of the instrument to play */
    instrumentName?: string | null;
    /** Disable and grey out the piano */
    disabled?: boolean;
    /** Overlay keyboard shortcuts and use keyboard */
    enableKeyboardShortcuts?: boolean;
    /** Key press event */
    onInput?: (event: MidiEvent) => void;
}
export const PianoInput: FC<PianoProps> = ({
    onInput,
    width,
    activeNotes,
    disabled = false,
    instrumentName = "acoustic_grand_piano",
    enableKeyboardShortcuts = false,
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
        const audioContext = new AudioContext();
        Soundfont.instrument(audioContext, instrumentName as any, { soundfont: "MusyngKite" }).then((instrument) =>
            setInstrument(instrument)
        );
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
    const keyboardShortcuts =
        (enableKeyboardShortcuts &&
            KeyboardShortcuts.create({
                firstNote: firstNote,
                lastNote: lastNote,
                keyboardConfig: KeyboardShortcuts.HOME_ROW,
            })) ||
        undefined;
    return (
        <Piano
            disabled={disabled}
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
