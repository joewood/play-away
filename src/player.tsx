import React, { memo, useCallback, useState } from "react";
import useDimensions from "react-use-dimensions";
import styled from "styled-components";
import { Connection } from "./connection";
import { Header } from "./header";
import { Modal, useModal } from "./modal";
import { StatusBar } from "./statusbar";
import { useMediaDevice } from "./use-media-device";
import { usePeerConnections } from "./use-peer";

interface RoomProps {
    className?: string;
}

const Player = memo<RoomProps>(({ className }) => {
    // Initialize Block
    const [ref, { width }] = useDimensions();
    const { settings, setModal, ...modalProps } = useModal();
    const [room, setRoom] = useState<string>();
    const { localStream, error: streamError, ...streamState } = useMediaDevice(settings.audioId, settings.videoId);
    const onShowHelp = useCallback(() => setModal((prev) => (prev === "help" ? undefined : "help")), [setModal]);
    const [audioContext, setAudioContext] = useState<AudioContext>();
    const onSetupAudioContext = useCallback(() => {
        const AudioContext =
            window.AudioContext || // Default
            (window as any).webkitAudioContext || // Safari and old versions of Chrome
            false;
        if (!AudioContext) return;
        setAudioContext((prev) => (prev ? prev : new AudioContext()));
    }, []);

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
        setRoom(undefined);
        setModal(undefined);
    }, [connections, setModal, removeConnection]);
    const onJoin = useCallback(
        (room: string) => {
            setModal(undefined);
            setRoom(room);
            if (!!room) connectToPeer(room, { name: settings.name || "anon" });
        },
        [connectToPeer, setModal, settings.name]
    );

    return (
        <div className={className} ref={ref}>
            <Modal connections={connections} onJoin={onJoin} settings={settings} setModal={setModal} {...modalProps} />

            <div className="main" onClick={onSetupAudioContext}>
                <Header
                    name={localPeer?.id || ""}
                    room={room}
                    onLeave={onLeave}
                    onShowSettings={() => setModal("settings")}
                    onShowHelp={onShowHelp}
                    onJoinOn={() => setModal("join")}
                    isConnected={isConnected}
                    {...streamState}
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
                            onRemoveConnection={removeConnection}
                        />
                    </div>
                ))}
                <div className="localConnection">
                    <Connection
                        key="local"
                        disabled={modalProps.showModal !== undefined}
                        connection={null}
                        peer={localPeer}
                        callingConnection={undefined}
                        midiDevice={settings.midiInputId}
                        onMidiEvent={sendData}
                        localStream={localStream}
                        callPeer={callPeer}
                        isConnected={isConnected}
                        settings={settings}
                        audioContext={audioContext}
                        width={width - 10}
                        onRemoveConnection={removeConnection}
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
Player.displayName = "Player";

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
