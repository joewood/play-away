import React, { FC, useCallback, useEffect, useState, useMemo } from "react";
import useInput from "react-use-input";
import styled from "styled-components";
import { useMediaDevices, useMidi } from "./hooks";
import { instrumentList } from "./instruments";
import createPersistedState from "use-persisted-state";

export interface SettingsType {
    audioId: string | undefined;
    videoId: string | undefined;
    instrument: string;
    midiInputId: string | undefined;
    midiOutputId: string | undefined;
    name: string;
}

const useSettingsState = createPersistedState<SettingsType>("play-away-settings");

export function useSettings() {
    const [settings, onChange] = useSettingsState({
        instrument: "acoustic_grand_piano",
        audioId: undefined,
        videoId: undefined,
        midiInputId: undefined,
        midiOutputId: undefined,
        name: undefined || "anon-" + Math.floor(Math.random() * 1000000),
    });
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const onCloseSettings = useCallback(() => setShowSettings(false), [setShowSettings]);
    const onShowSettings = useCallback(() => setShowSettings(true), [setShowSettings]);
    return useMemo(() => ({ settings, onChange, showSettings, onShowSettings, onCloseSettings }), [
        settings,
        onChange,
        showSettings,
        onShowSettings,
        onCloseSettings,
    ]);
}

interface SettingsProps {
    className?: string;
    settings: SettingsType;
    onChange: (callOptions: SettingsType) => void;
    onCloseSettings: () => void;
}

const _Settings: FC<SettingsProps> = ({ className, settings, onChange, onCloseSettings }) => {
    const webMidi = useMidi();
    const mediaDevices = useMediaDevices();

    const [audioId, setAudioId] = useInput(settings?.audioId);
    const [videoId, setVideoId] = useInput(settings?.videoId);
    const [instrument, setInstrument] = useInput(settings.instrument);
    const [midiInputId, setMidiInputId] = useInput(settings.midiInputId);
    const [midiOutputId, setMidiOutputId] = useInput(settings.midiOutputId);
    const [name, setName] = useInput(settings.name);
    useEffect(() => {
        onChange({
            audioId,
            videoId,
            instrument,
            midiInputId,
            midiOutputId,
            name,
        });
    }, [onChange, audioId, videoId, mediaDevices, instrument, midiInputId, midiOutputId, name]);

    return (
        <div className={className}>
            <div className="title">PlayAway Settings</div>
            <label htmlFor="setaudio">Microphone:</label>
            <select id="setaudio" defaultValue={settings?.audioId} onChange={setAudioId}>
                {mediaDevices
                    .filter((f) => f.kind === "audioinput")
                    .map((i) => (
                        <option key={i.deviceId} value={i.deviceId}>
                            {i.label}
                        </option>
                    ))}
            </select>
            <label htmlFor="setVideo">Camera:</label>
            <select id="setvideo" defaultValue={settings?.videoId} onSelect={setVideoId}>
                {mediaDevices
                    .filter((device) => device.kind === "videoinput")
                    .map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label}
                        </option>
                    ))}
            </select>
            <label htmlFor="setInstrument">Instrument:</label>
            <select id="setInstrument" onChange={setInstrument} value={instrument}>
                {instrumentList.map((instrument) => (
                    <option key={instrument} value={instrument}>
                        {instrument}
                    </option>
                ))}
            </select>
            <label htmlFor="setmidiin">Midi Input:</label>
            <select id="setmidiin" onChange={setMidiInputId} value={midiInputId}>
                <option key={0} value={undefined}>
                    None
                </option>
                {webMidi?.inputs.map((device) => (
                    <option key={device.id} value={device.id}>
                        {device.name}
                    </option>
                ))}
            </select>
            <label htmlFor="setmidiout">Midi Output:</label>
            <select id="setmidiout" onChange={setMidiOutputId} value={midiOutputId}>
                <option key={0} value={undefined}>
                    None
                </option>
                {webMidi?.outputs.map((device) => (
                    <option key={device.id} value={device.id}>
                        {device.name}
                    </option>
                ))}
            </select>
            <label htmlFor="nameField">Name:</label>
            <input type="text" onChange={setName} value={name}></input>
            <button onClick={onCloseSettings}>Close</button>
        </div>
    );
};
export const Settings = styled(_Settings)`
    display: grid;
    width: auto;
    margin-left: auto;
    margin-right: auto;
    padding: 25px;
    grid-template-columns: auto auto;
    grid-template-rows: repeat(auto-fill, auto) auto;
    row-gap: 2rem;
    column-gap: 2rem;
    justify-items: stretch;
    font-size: 1rem;
    & button {
        font-size: 1rem;
        grid-column: 1/3;
        align-self: flex-end;
        justify-self: end;
        padding: 0.5rem;
        font-weight: bold;
        background-color: rgba(255, 255, 255, 0.1);
        border: rgba(255, 255, 255, 0.2);
        color: white;
    }
    & option,
    & select {
        font-size: 1rem;
    }
    & > .title {
        font-size: 2rem;
        grid-column: 1/3;
    }
    & a {
        text-shadow: 1px 0 5px rgba(192, 192, 255, 1);
        font-size: 20px;
        padding: 10px;
    }
`;
