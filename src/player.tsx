import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import useDimensions from "react-use-dimensions";
import styled from "styled-components";
import { Connection } from "./connection";
import { Header } from "./header";
import { useMediaDevice, useMidiInputs, MidiEvent } from "./hooks";
import { StatusBar } from "./midi-components";
import { usePiano } from "./piano";
import { Settings, useSettings } from "./settings";
import { usePeerConnection2 } from "./use-peer";
import { Welcome } from "./welcome";

interface RoomProps {
    isReceiver: boolean;
    broker?: string;
    override: string;
    className?: string;
}

const Player = memo<RoomProps>(({ isReceiver, broker, override, className }) => {
    // Initialize Block
    const [ref, { width }] = useDimensions();
    const [cameraOn, setCameraOn] = useState(false);
    const [microphoneOn, setMicrophoneOn] = useState(false);
    const { showSettings, onShowSettings, settings, ...settingsProps } = useSettings();
    const [showHelp, setShowHelp] = useState(false);
    const onShowHelp = useCallback(() => setShowHelp((prev) => !prev), [setShowHelp]);
    const mediaConstraints = useMemo<MediaStreamConstraints>(
        () => ({
            audio: microphoneOn ? { deviceId: settings?.audioId } : undefined,
            video: cameraOn ? { deviceId: settings?.videoId } : undefined,
        }),
        [cameraOn, microphoneOn, settings]
    );
    const [localStream, mediaError] = useMediaDevice(mediaConstraints);
    const [midiInputData] = useMidiInputs(settings.midiInputId);
    // Connectivity Block
    const { callPeer, connections, localPeer, error, sendData, connectToPeer, ...peerData } = usePeerConnection2({
        brokerId: override,
    });
    const onJoin = useCallback(() => {
        if (!!broker) connectToPeer(broker);
    }, [connectToPeer, broker]);
    // const [
    //     receiveData,
    //     remoteIsCallingConnection,
    //     error,
    //     { sendData, callPeer, connections, isReceiveConnected, localPeerId },
    // ] = usePeer<MidiEvent>(isReceiver, broker, { brokerId: override });

    // const [pianoData, setPianoData] = useState<MidiEvent | null>(null);
    // const [instrument, setInstrument] = useState();

    // const connectionNanes = useMemo(() => connections.map((c) => c.label), [connections]);
    useEffect(() => {
        if (!!midiInputData) sendData(midiInputData);
    }, [midiInputData, sendData]);
    return (
        <div className={className} ref={ref}>
            <div className="modal" style={{ visibility: showHelp ? "visible" : "collapse" }}>
                <div>
                    <Welcome broker={localPeer?.id || "??"} />
                </div>
            </div>
            <div className="modal" style={{ visibility: showSettings ? "visible" : "collapse" }}>
                <div>{showSettings && <Settings settings={settings} {...settingsProps} />}</div>
            </div>
            <div className="main">
                <Header
                    name={localPeer?.id || ""}
                    cameraOn={cameraOn}
                    onCameraOn={setCameraOn}
                    microphoneOn={microphoneOn}
                    onMicrophoneOn={setMicrophoneOn}
                    onShowSettings={onShowSettings}
                    onShowHelp={onShowHelp}
                    onJoin={onJoin}
                    isReceiver={isReceiver}
                    broker={isReceiver ? broker : localPeer?.id || ""}
                />
                {connections.map((connection) => (
                    <div className="connection">
                        <Connection
                            key={connection.peer}
                            peer={null}
                            connection={connection}
                            callingConnection={peerData.remoteMediaConnection}
                            localStream={localStream}
                            callPeer={callPeer}
                            settings={settings}
                            width={width - 20}
                        />
                    </div>
                ))}
                <div className="localConnection">
                    <Connection
                        connection={null}
                        peer={localPeer}
                        callingConnection={undefined}
                        onMidiEvent={sendData}
                        localStream={localStream}
                        callPeer={callPeer}
                        settings={settings}
                        width={width - 4}
                    />
                </div>
                <StatusBar error={error} session={`${localPeer?.id}`} connections={connections.length} />
            </div>
        </div>
    );
});

export default styled(Player)`
    position: relative;
    height: 100vh;
    touch-action: manipulation;
    box-sizing: border-box;
    & .connection {
        flex: 0 0 auto;
        pointer-events: none;
        margin-left: 10;
        margin-right: 10;
    }
    & .localConnection {
        margin-left: 2;
        margin-right: 2;
    }
    & a {
        color: rgb(224, 224, 255);
        text-decoration: none;
        font-weight: bold;
    }
    & > .main {
        display: flex;
        justify-content: space-between;
        align-items: stretch;
        flex-direction: column;
        height: 100vh;
    }

    & > .modal {
        position: absolute;
        display: grid;
        height: 100%;
        width: 100%;
        place-items: center;
        place-content: center;
        left: 0;
        top: 3rem;
        justify-content: center;
        align-content: center;
        > div {
            display: flex;
            align-items: center; /* new */
            justify-content: center; /* new */

            grid: 1/2 1/2;
            color: white;
            z-index: 1800;
            /* left: 10vw; */
            box-shadow: 10px 10px 20px #000;
            background-color: rgba(0, 0, 0, 0.9);
            padding-left: 2rem;
            padding-right: 2rem;
            padding-top: 0rem;
            padding-bottom: 0rem;
            max-width: 75vw;
            max-height: 85vh;
            overflow-y: scroll;
        }
    }
`;
