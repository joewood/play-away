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
export function useMidiInputs(midiId: string | undefined) {
    const [midiInput, setInput] = useState<WebMidi.MIDIInput>();
    const webMidi = useMidi();
    const [data, setData] = useState<MidiEvent | null>(null);
    const onData = useCallback(
        (evt: WebMidi.MIDIMessageEvent) => {
            const data = evt.data;
            console.log("Midi Data", data);
            if (data.length === 3) {
                setData(getEventData(data));
            }
        },
        [setData]
    );
    useEffect(() => setInput(webMidi?.inputs.find((i) => i.id === midiId)), [midiId, webMidi]);
    useEffect(() => {
        if (!midiInput) return;
        midiInput.open().then((x) => {
            console.log("Setting Up Input Device", x);
            console.log("--Connected Up", midiInput.connection);
            midiInput.addEventListener("midimessage", onData);
        });
        return () => midiInput && midiInput.removeEventListener("midimessage", onData as EventListener);
    }, [onData, midiInput]);
    return [data, midiInput] as [MidiEvent | null, WebMidi.MIDIInput | undefined];
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

export function useMediaDevices(): MediaDeviceInfo[] {
    const [devices, setDevices] = useState<MediaDeviceInfo[]>();
    const onDeviceChange = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            setDevices(devices);
        } catch (err) {
            console.error(err);
            setDevices([]);
        }
    }, [setDevices]);
    useEffect(() => {
        if (devices === undefined) onDeviceChange();
    }, [devices, onDeviceChange]);
    useEffect(() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("getUserMedia not supported on your browser!");
            return;
        }
        navigator.mediaDevices.addEventListener("devicechange", onDeviceChange);
        return () => navigator.mediaDevices.removeEventListener("devicechange", onDeviceChange);
    }, [onDeviceChange]);
    return devices || [];
}

/** Returns the best suited Media Device based on the constraints */
export function useMediaDevice(constraints: MediaStreamConstraints): [MediaStream | undefined, any] {
    const [stream, setStream] = useState<MediaStream>();
    const [error, setError] = useState<any>();
    useEffect(() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.log("getUserMedia not supported on your browser!");
            setError(null);
            return;
        }
        if (!!constraints.audio || !!constraints.video) {
            console.log("Media Constraints");
            navigator.mediaDevices
                .getUserMedia(constraints)
                .then(setStream)
                .catch((err) => {
                    console.log("The following getUserMedia error occured: " + err);
                    setError(err);
                });
        } else {
            setStream(undefined);
        }
    }, [setStream, constraints, setError]);
    useEffect(() => {
        return () => {
            if (!!stream) stream.getTracks().forEach((t) => t.stop());
        };
    }, [stream]);
    return [stream, error];
}
