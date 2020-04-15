import { useCallback, useEffect, useState } from "react";

export interface MidiEvent {
    /** Command part 4 MSB of the byte tripple - 8: STOP, 9: PLAY */
    command: number;
    /** Byte number for the note */
    note: number;
    /** Velocity of the note */
    velocity: number;
}
export const PLAY = 0x09;
export const STOP = 0x08;

interface MidiDevices {
    inputs: WebMidi.MIDIInput[];
    outputs: WebMidi.MIDIOutput[];
}

/** Hook to return the set of Input and Output Midi Devices */
export function useMidi() {
    const [webMidi, setWebMidi] = useState<MidiDevices | null | undefined>();
    useEffect(() => {
        if (!!navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(
                (midiAccess) => {
                    setWebMidi({
                        inputs: Array.from(midiAccess.inputs.values()),
                        outputs: Array.from(midiAccess.outputs.values()),
                    });
                },
                (midiFailure: any) => setWebMidi(null)
            );
        } else {
            setWebMidi(null);
        }
    }, []);
    return webMidi;
}

/** Convert a byte array to a typed Midi Event */
export function getEventData(data: Uint8Array): MidiEvent {
    // status is the first byte.
    let status = data[0];
    // command is the four most significant bits of the status byte.
    let command = status >>> 4;
    // channel 0-15 is the lower four bits.
    let channel = status & 0xf;
    console.log(`$Command: ${command.toString(16)}, Channel: ${channel.toString(16)}`);
    // note number is the second byte.
    let note = data[1];
    let velocity = data[2];
    // let commandStr = command === 0x9 ? "play" : command === 0x8 ? "stop" : "";
    return { command, note, velocity };
}

/** Convert command, note and velocity to a Byte Array  */
export function getBinary({ command, note, velocity }: MidiEvent): Uint8Array {
    const data = new Uint8Array(3);
    data[0] = command >>> -4;
    data[1] = note;
    data[2] = velocity;
    return data;
}

/** Midi Input Hook, returns the stream of data from midi devices set using the setInputs function */
export function useMidiInputs() {
    const [midiInput, setInput] = useState<WebMidi.MIDIInput>();
    const [data, setData] = useState<MidiEvent | null>(null);
    const onData = useCallback(
        (msg: WebMidi.MIDIMessageEvent) => {
            const data = msg.data;
            console.log("data", data);
            if (data.length === 3) {
                setData(getEventData(data));
            }
        },
        [setData]
    );
    useEffect(() => {
        if (!midiInput) return;
        midiInput.open().then((x) => {
            console.log("Setting Up Input Device", x);
            console.log("--Connected Up", midiInput.connection);
            midiInput.addEventListener("midimessage", onData);
        });
    }, [onData, midiInput]);
    return [data, midiInput, setInput] as [MidiEvent | null, WebMidi.MIDIInput | undefined, typeof setInput];
}

export function useMidiOutputs() {
    const [outputs, setOutputs] = useState<WebMidi.MIDIOutput[]>([]);

    useEffect(() => {
        for (const midi of outputs) {
            midi.open().then((x) => {
                console.log("Setting Up Output Device", x);
                console.log("--Connected Up", midi.connection);
            });
        }
    }, [outputs]);
    const play = useCallback(
        (event: MidiEvent) => {
            for (const output of outputs) output.send(getBinary(event));
        },
        [outputs]
    );
    return [play, setOutputs] as [typeof play, typeof setOutputs];
}

/** Hook to manage the state of which midi-notes are actively playing
 * Two events are accepted, as two input channels (e.g. on screen keyboard and connected device)
 */
export function useActiveNotes(midiEvent: MidiEvent | null, localEvent: MidiEvent | null) {
    // the state of active notes - maintained in an array using midi-codes.
    const [activeNotes, setActiveNotes] = useState<number[]>([]);
    const midiCommand = midiEvent?.command || 0;
    const midiNote = midiEvent?.note || 0;
    useEffect(() => {
        // use the callback form of setting state to ensure no race conditions
        setActiveNotes((prevActiveNotes) => {
            if (midiCommand === STOP) {
                if (prevActiveNotes.find((note) => note === midiNote) === undefined) return prevActiveNotes;
                return prevActiveNotes.filter((activeNote) => activeNote !== midiNote);
            }
            if (midiCommand === PLAY) return [...prevActiveNotes, midiNote];
            return prevActiveNotes;
        });
    }, [midiCommand, midiNote]);
    const localCommand = localEvent?.command || 0;
    const localNote = localEvent?.note || 0;
    useEffect(() => {
        setActiveNotes((prevActiveNotes) => {
            if (localCommand === STOP) {
                if (prevActiveNotes.find((note) => note === localNote) === undefined) return prevActiveNotes;
                return prevActiveNotes.filter((note) => note !== localNote);
            }
            if (localCommand === PLAY) return [...prevActiveNotes, localNote];
            return prevActiveNotes;
        });
    }, [localCommand, localNote]);
    return activeNotes;
}

export function useMediaDevice(): [MediaStream | undefined, any] {
    const [stream, setStream] = useState<MediaStream>();
    const [error, setError] = useState<any>();
    useEffect(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            console.log("getUserMedia supported.");
            navigator.mediaDevices
                .getUserMedia({ audio: true, video: true })
                .then(setStream)
                .catch(function (err) {
                    console.log("The following getUserMedia error occured: " + err);
                    setError(err);
                });
        } else {
            console.log("getUserMedia not supported on your browser!");
            setError(null);
        }
    }, [setStream, setError]);
    return [stream, error];
}
