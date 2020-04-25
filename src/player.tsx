import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import useDimensions from "react-use-dimensions";
import styled from "styled-components";
import { Connection } from "./connection";
import { Header } from "./header";
import { useMediaDevice } from "./use-media-device";
import { useMidiInputs } from "./use-midi";
import { StatusBar } from "./statusbar";
import { Settings, useSettings } from "./settings";
import { usePeerConnections } from "./use-peer";
import { Welcome } from "./welcome";
import { useRooms, Join } from "./use-rooms";

import createPersistedState from "use-persisted-state";
const useMicrophoneState = createPersistedState<boolean>("microphone");
const useCameraState = createPersistedState<boolean>("camera");

interface RoomProps {
    isReceiver: boolean;
    broker?: string;
    override: string;
    className?: string;
}

const Player = memo<RoomProps>(({ isReceiver, broker, override, className }) => {
    // Initialize Block
    const [ref, { width }] = useDimensions();
    const [cameraOn, setCameraOn] = useCameraState(true);
    const [microphoneOn, setMicrophoneOn] = useMicrophoneState(true);
    const { showSettings, onShowSettings, settings, ...settingsProps } = useSettings();
    const [showHelp, setShowHelp] = useState(false);
    const [showJoin, setShowJoin] = useState(true);
    const [room, setRoom] = useState<string>();

    const onShowHelp = useCallback(() => setShowHelp((prev) => !prev), [setShowHelp]);
    const [audioContext, setAudioContext] = useState<AudioContext>();
    const onSetupAudioContext = useCallback(() => {
        const AudioContext =
            window.AudioContext || // Default
            (window as any).webkitAudioContext || // Safari and old versions of Chrome
            false;
        if (!AudioContext) return;
        setAudioContext(new AudioContext());
    }, []);
    const mediaConstraints = useMemo<MediaStreamConstraints>(
        () => ({
            audio: microphoneOn ? { deviceId: settings?.audioId } : undefined,
            video: cameraOn ? { deviceId: settings?.videoId } : undefined,
        }),
        [cameraOn, microphoneOn, settings]
    );
    const [localStream] = useMediaDevice(mediaConstraints);
    const [midiInputData] = useMidiInputs(settings.midiInputId);
    // Connectivity Block
    const {
        isOpen: isConnected,
        callPeer,
        connections,
        localPeer,
        peerError,
        sendData,
        connectToPeer,
        removeConnection,
        ...peerData
    } = usePeerConnections({
        brokerId: settings.name,
    });
    const onLeave = useCallback(() => {
        for (const c of connections) {
            removeConnection(c);
        }
        setShowJoin(true);
    }, [connections, removeConnection]);
    useEffect(() => {
        if (!!midiInputData) sendData(midiInputData);
    }, [midiInputData, sendData]);
    const onJoin = useCallback(
        (room: string) => {
            setShowJoin(false);
            setRoom(room);
            if (!!room) connectToPeer(room, { name: settings.name || "anon" });
        },
        [connectToPeer, settings.name]
    );

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
            <div className="modal" style={{ visibility: showJoin ? "visible" : "collapse" }}>
                <div>{showJoin && <Join name={settings.name} onJoin={onJoin} />}</div>
            </div>

            <div className="main" onClick={onSetupAudioContext}>
                <Header
                    name={localPeer?.id || ""}
                    cameraOn={cameraOn}
                    onCameraOn={setCameraOn}
                    microphoneOn={microphoneOn}
                    room={room}
                    onLeave={onLeave}
                    onMicrophoneOn={setMicrophoneOn}
                    onShowSettings={onShowSettings}
                    onShowHelp={onShowHelp}
                    onJoinOn={setShowJoin}
                    isConnected={isConnected}
                />
                {connections.map((connection, i) => (
                    <div className="connection" key={i}>
                        <Connection
                            key={i}
                            peer={null}
                            connection={connection}
                            callingConnection={peerData.remoteCallingMediaConnection}
                            localStream={localStream}
                            callPeer={callPeer}
                            settings={settings}
                            isConnected={connection.open}
                            audioContext={audioContext}
                            width={width - 20}
                        />
                    </div>
                ))}
                <div className="localConnection">
                    <Connection
                        key="local"
                        disabled={showSettings}
                        connection={null}
                        peer={localPeer}
                        callingConnection={undefined}
                        onMidiEvent={sendData}
                        localStream={localStream}
                        callPeer={callPeer}
                        isConnected={isConnected}
                        settings={settings}
                        audioContext={audioContext}
                        width={width - 10}
                    />
                </div>
                <StatusBar
                    error={peerError}
                    connected={isConnected}
                    session={localPeer?.id || "Initializing"}
                    connections={connections.length}
                />
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
        padding-left: 10px;
        padding-right: 10px;
    }
    & .localConnection {
        padding-left: 5px;
        padding-right: 5px;
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
    & .pulsate {
        animation: pulsate 3s ease-out;
        animation-iteration-count: infinite;
        opacity: 0.5;
    }
    @keyframes pulsate {
        0% {
            opacity: 0.5;
        }
        50% {
            opacity: 1;
        }
        100% {
            opacity: 0.5;
        }
    }
`;
