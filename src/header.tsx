import React, { FC, useCallback } from "react";
import Clipboard from "react-clipboard.js";
import { FaCamera } from "react-icons/fa";
import { FiCameraOff, FiHelpCircle, FiMic, FiMicOff, FiSettings } from "react-icons/fi";
import styled from "styled-components";

export interface CallOptions {
    audio: MediaDeviceInfo | undefined;
    video: MediaDeviceInfo | undefined;
}

interface HeaderProps {
    name: string;
    className?: string;
    isReceiver: boolean;
    broker?: string;
    cameraOn: boolean;
    microphoneOn: boolean;
    isConnected: boolean;
    onJoin: () => void;
    onShowHelp: () => void;
    onCameraOn: (on: boolean) => void;
    onMicrophoneOn: (on: boolean) => void;
    onShowSettings: () => void;
}

const url = window.location.toString();

const _Header: FC<HeaderProps> = ({
    className,
    isReceiver,
    broker,
    cameraOn,
    onJoin,
    microphoneOn,
    isConnected,
    onCameraOn,
    onMicrophoneOn,
    onShowSettings,
    onShowHelp,
}) => {
    const joinUrl = `${url}?broker=${broker}`;
    const onClickCameraOn = useCallback((x: any) => onCameraOn(!cameraOn), [onCameraOn, cameraOn]);
    const onClickMicrophoneOn = useCallback((x: any) => onMicrophoneOn(!microphoneOn), [onMicrophoneOn, microphoneOn]);
    return (
        <header className={className}>
            <a className="logo" href="/">
                /PlayAway
            </a>
            {isReceiver && broker && isConnected && (
                <div className="join pulsate">
                    <div>{broker}</div>
                    <button onClick={onJoin}>Join</button>
                </div>
            )}
            {!isReceiver && broker && (
                <div className="join">
                    <a href={joinUrl} target="__blank">
                        {joinUrl}
                    </a>
                    <Clipboard data-clipboard-text={joinUrl} button-href="#">
                        Copy
                    </Clipboard>
                </div>
            )}
            <button onClick={onClickMicrophoneOn}>{microphoneOn ? <FiMic /> : <FiMicOff />}</button>
            <button onClick={onClickCameraOn}>{cameraOn ? <FaCamera /> : <FiCameraOff />}</button>
            <button onClick={onShowSettings}>{<FiSettings />}</button>
            <button onClick={onShowHelp}>{<FiHelpCircle />}</button>
        </header>
    );
};
export const Header = styled(_Header)`
    background-color: #282c34;
    height: 3rem;
    display: grid;
    grid-template-columns: 1fr auto auto auto auto;
    column-gap: 1rem;
    font-size: 2rem;
    color: white;
    place-items: center end;
    padding-left: 2px;
    padding-right: 2px;
    width: 100%;
    & > a {
        justify-self: start;
        text-shadow: 1px 0 5px rgba(192, 192, 255, 1);
        font-size: 2rem;
        padding: 0.25rem;
    }
    & .join {
        align-self: center;
        display: flex;
        flex-direction: row;
        align-items: center;
        & > *:first-child {
            font-size: 1rem;
            display: inline-block;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.25rem;
            padding: 0.5rem;
        }
        & > button {
            display: inline-block;
            font-size: 1rem;
            padding: 0.5rem;
        }
    }
    > * {
        grid-row: 1/2;
    }
    & button {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
        font-size: 1.5rem;
        background-color: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 0px;
        color: white;
    }
`;
