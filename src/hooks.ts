import { useState, useEffect, useMemo, useCallback } from "react";

export interface MidiEvent {
    command: number;
    note: number;
    velocity: number;
}
export const PLAY = 0x09;
export const STOP = 0x08;

export function useMidi() {
    const [webMidi, setWebMidi] = useState<
        { inputs: WebMidi.MIDIInput[]; outputs: WebMidi.MIDIOutput[] } | null | undefined
    >();
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

export function getBinary({ command, note, velocity }: MidiEvent): Uint8Array {
    const data = new Uint8Array(3);
    data[0] = command >>> -4;
    data[1] = note;
    data[2] = velocity;
    return data;
}

export function useMidiInputs() {
    const [inputs, setInputs] = useState<WebMidi.MIDIInput[]>([]);
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
        for (const midiInput of inputs) {
            midiInput.open().then((x) => {
                console.log("Setting Up Input Device", x);
                console.log("--Connected Up", midiInput.connection);
                midiInput.addEventListener("midimessage", onData);
            });
        }
    }, [onData, inputs]);
    return [data, setInputs] as [MidiEvent | null, typeof setInputs];
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

export function useActiveNotes(event: MidiEvent | null, localEvent: MidiEvent | null) {
    const command = event?.command || 0;
    const note = event?.note || 0;
    const [activeNotes, setActiveNotes] = useState<number[]>([]);
    useEffect(() => {
        setActiveNotes((state) => {
            if (command === STOP) return state.filter((s) => s !== note);
            if (command === PLAY) return [...state, note];
            return state;
        });
    }, [command, note]);
    const localCommand = localEvent?.command || 0;
    const localNote = localEvent?.note || 0;
    useEffect(() => {
        setActiveNotes((state) => {
            if (localCommand === STOP) return state.filter((s) => s !== localNote);
            if (localCommand === PLAY) return [...state, localNote];
            return state;
        });
    }, [localCommand, localNote]);
    return activeNotes;
}
