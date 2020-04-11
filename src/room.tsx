import React, { FC, useCallback, useEffect, useState, useMemo, useRef } from "react";
import { usePeerState, useReceivePeerState } from "react-peer";
import useDimensions from "react-use-dimensions";
import "./App.css";
import { MidiEvent, useActiveNotes, useMidiInputs, useMidiOutputs } from "./hooks";
import { MidiSelect, PianoInput, StatusBar } from "./midi-components";
import { connect } from "http2";

function useTimeout(connected: boolean, seconds: number, cb: () => void) {
    const ref = useRef<any>(null);
    const timeout = useCallback(() => {
        if (connected) return;
        cb();
    }, [connected, cb]);
    useEffect(() => {
        if (connected) return;
        ref.current = setTimeout(timeout, seconds * 1000);
        return () => {
            if (ref.current) clearTimeout(ref.current);
        };
    }, [connected, seconds, timeout, ref]);
}

interface RoomProps {
    sendingName: string;
    receivingName: string;
}

const Teacher: FC<RoomProps> = ({ sendingName, receivingName }) => {
    const [sendName, setSendName] = useState(sendingName);

    const [, sendData, , sendingConnections, errorSend] = usePeerState<MidiEvent>(
        { command: 0, note: 0, velocity: 0 },
        { brokerId: sendName }
    );
    const cb2 = useCallback(
        () => setSendName(sendName === sendingName ? "SERVER" + Math.random() * 1000 : sendingName),
        [sendingName, sendName]
    );
    useTimeout(sendingConnections.length > 0, 10, cb2);

    const [recName, setRecName] = useState(receivingName);
    const [receiveData, isReceiveConnected, errorReceive] = useReceivePeerState<MidiEvent>(recName);
    const cb = useCallback(
        () => setRecName(recName === receivingName ? "SERVER" + Math.random() * 1000 : receivingName),
        [receivingName, recName]
    );
    useTimeout(isReceiveConnected, 10, cb);

    const [pianoData, setPianoData] = useState<MidiEvent | null>(null);
    const [midiInputData, setMidiInput] = useMidiInputs();
    const [, setMidiOutput] = useMidiOutputs();
    const [ref, { width }] = useDimensions();
    const onPianoInput = useCallback(
        (event: MidiEvent) => {
            sendData(event);
            setPianoData(event);
        },
        [sendData, setPianoData]
    );
    const connectionNanes = useMemo(() => sendingConnections.map((c) => c.label), [sendingConnections]);
    useEffect(() => {
        if (!!midiInputData) sendData(midiInputData);
    }, [midiInputData, sendData]);
    const midiActiveNotes = useActiveNotes(midiInputData, pianoData);
    const remoteActiveNotes = useActiveNotes(receiveData || null, null);
    return (
        <div className="App" ref={ref}>
            <header className="App-header">
                <a href="/">Play Away - Playing "{sendingName}"</a>
            </header>
            <MidiSelect key="select" onInputSelect={setMidiInput} onOutputSelect={setMidiOutput} />
            <div style={{ flex: "0 0 auto", pointerEvents: "none", marginLeft: 30, marginRight: 30 }}>
                <p>Remote: {isReceiveConnected ? "Connected" : "Not Connected"}</p>
                <PianoInput disabled={!isReceiveConnected} width={width - 60} activeNotes={remoteActiveNotes} />
            </div>
            <div style={{ flex: "0 0 auto", marginLeft: 5, marginRight: 5 }}>
                <p>You: {sendingConnections.length > 0 ? "Sending" : "Not Sending"} </p>
                <PianoInput
                    width={width - 10}
                    enableKeyboardShortcuts
                    onInput={onPianoInput}
                    activeNotes={midiActiveNotes}
                />
            </div>
            <StatusBar
                error={errorSend || errorReceive}
                session={`${sendName}/${recName}`}
                connections={connectionNanes}
            />
        </div>
    );
};

export default Teacher;