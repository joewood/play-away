import React, { FC, FormEventHandler, useCallback } from "react";
import Clipboard from "react-clipboard.js";
import "react-piano/dist/styles.css";
import styled from "styled-components";
import { useMidi } from "./hooks";
import { instrumentList } from "./instruments";

interface HeaderProps extends MidiSelectProps, InstrumentSelectProps {
    name: string;
    className?: string;
    isReceiver: boolean;
    broker?: string;
}

const url = window.location.toString();

const _Header: FC<HeaderProps> = ({
    className,
    onInputSelect,
    midiDevice,
    isReceiver,
    broker,
    instrument,
    onInstrumentSelect,
}) => {
    const joinUrl = `${url}?broker=${broker}`;
    return (
        <header className={className}>
            <a href="/">/PlayAway</a>
            <div className="settings">
                {!isReceiver && (
                    <div className="join">
                        <a href={joinUrl} target="__blank">
                            {joinUrl}
                        </a>
                        <Clipboard data-clipboard-text={joinUrl} button-href="#">
                            Copy Link
                        </Clipboard>
                    </div>
                )}
                <InstrumentSelect instrument={instrument} onInstrumentSelect={onInstrumentSelect} />
                <MidiSelect midiDevice={midiDevice} onInputSelect={onInputSelect} />
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
    & .settings {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        flex: 0 0 auto;
        font-size: 12px;
        > div {
            margin-left: 8px;
        }
        > .join {
            display: flex;
            flex-direction: row;
            align-items: center;
            & > * {
                margin-left: 4px;
            }
        }
        & button {
            padding: 1px;
            background-color: rgba(255, 255, 255, 0.1);
            border: rgba(255, 255, 255, 0.2);
            color: white;
        }
    }
`;

interface InstrumentSelectProps {
    onInstrumentSelect: (instrument: string) => void;
    instrument: string;
    className?: string;
}

const _InstrumentSelect: FC<InstrumentSelectProps> = ({ onInstrumentSelect, className, instrument }) => {
    const onInputChange = useCallback<FormEventHandler<HTMLSelectElement>>(
        (event) => onInstrumentSelect(event.currentTarget.value),
        [onInstrumentSelect]
    );
    return (
        <div className={className}>
            <div>Instrument</div>
            <select onChange={onInputChange} value={instrument}>
                {instrumentList.map((v, i) => (
                    <option key={i} value={v}>
                        {v}
                    </option>
                ))}
            </select>
        </div>
    );
};
const InstrumentSelect = styled(_InstrumentSelect)`
    padding-right: 10px;
`;

interface MidiSelectProps {
    onInputSelect?: (input: WebMidi.MIDIInput) => void;
    className?: string;
    midiDevice: WebMidi.MIDIInput | undefined;
    // onOutputSelect?: (outputs: WebMidi.MIDIOutput[]) => void;
}

const _MidiSelect: FC<MidiSelectProps> = ({ midiDevice, onInputSelect, className }) => {
    const webMidi = useMidi();
    // const [input, setInput] = useState<WebMidi.MIDIInput>([]);
    const onInputChange = useCallback<FormEventHandler<HTMLSelectElement>>(
        (event) => {
            if (!webMidi || !onInputSelect) return;
            const device = webMidi.inputs.find((device) => device.id === event.currentTarget.value);
            if (!!device) onInputSelect(device);
        },
        [onInputSelect, webMidi]
    );
    // useEffect(() => {
    //     if (!!onInputSelect) onInputSelect(input);
    // }, [input, onInputSelect]);
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
            <select onChange={onInputChange} value={midiDevice && midiDevice.id}>
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
    padding-right: 10px;
`;
