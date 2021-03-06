import React, { FC, useEffect, useMemo, memo } from "react";
import useInput from "react-use-input";
import styled from "styled-components";
import createPersistedState from "use-persisted-state";
import { instrumentList } from "./instruments";
import { useMediaDevices } from "./use-media-device";
import { useMidi } from "./use-midi";

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
    return useMemo(() => ({ settings, onChange }), [settings, onChange]);
}

const SettingsRoot = styled.div`
    display: grid;
    width: auto;
    margin-left: auto;
    margin-right: auto;
    padding: 2rem;
    grid-template-columns: auto auto;
    grid-template-rows: repeat(auto-fill, auto) auto;
    row-gap: 2rem;
    column-gap: 2rem;
    justify-items: stretch;
    font-size: 1rem;
`;

export interface SettingsProps {
    className?: string;
    settings: SettingsType;
    onChange: (callOptions: SettingsType) => void;
}

export const Settings = memo<SettingsProps>(({ className, settings, onChange }) => {
    const webMidi = useMidi();
    const mediaDevices = useMediaDevices();

    const [audioId, setAudioId] = useInput(settings?.audioId);
    const [videoId, setVideoId] = useInput(settings?.videoId);
    const [instrument, setInstrument] = useInput(settings.instrument);
    const [midiInputId, setMidiInputId] = useInput(settings.midiInputId);
    const [midiOutputId, setMidiOutputId] = useInput(settings.midiOutputId);
    const [name, setName] = useInput(settings.name);
    useEffect(() => {
        console.log("Updating Settings", audioId + "-" + videoId);
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
        <SettingsRoot>
            <div className="title">PlayAway Settings</div>
            <label htmlFor="nameField">Unique Name:</label>
            <input type="text" onChange={setName} value={name}></input>
            <label htmlFor="setaudio">Microphone:</label>
            <select
                id="setaudio"
                defaultValue={settings?.audioId}
                onChange={setAudioId}
                disabled={mediaDevices.every((m) => !m.label)}
            >
                {mediaDevices
                    .filter((f) => f.kind === "audioinput")
                    .map(({ deviceId, label }) => ({ deviceId: deviceId as string | undefined, label }))
                    .concat({ deviceId: undefined, label: "None" })
                    .map((i) => (
                        <option key={i.deviceId} value={i.deviceId}>
                            {i.label === "" ? "Unknown" : i.label}
                        </option>
                    ))}
            </select>
            <label htmlFor="setVideo">Camera:</label>
            <select
                id="setvideo"
                defaultValue={settings?.videoId}
                onChange={setVideoId}
                disabled={mediaDevices.every((m) => !m.label)}
            >
                {mediaDevices
                    .filter((device) => device.kind === "videoinput")
                    .map(({ deviceId, label }) => ({ deviceId: deviceId as string | undefined, label }))
                    .concat({ deviceId: undefined, label: "None" })
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
        </SettingsRoot>
    );
});
