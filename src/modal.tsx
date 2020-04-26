import { DataConnection } from "peerjs";
import React, { FC, useCallback, useState } from "react";
import styled from "styled-components";
import { Settings, SettingsProps, SettingsType, useSettings } from "./settings";
import { Join } from "./use-rooms";
import { Welcome } from "./welcome";

type ModalType = "help" | "join" | "settings" | undefined;
export function useModal() {
    const { settings, ...settingsProps } = useSettings();
    const [showModal, setModal] = useState<ModalType>();
    return { showModal, setModal, settings, ...settingsProps };
}

const ModalRoot = styled.div`
    position: absolute;
    height: 100%;
    width: 100%;
    display: grid;
    place-items: center;
    place-content: center;
    left: 0;
    top: 3rem;
    justify-content: center;
    align-content: center;
    > .center {
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
        > .modal-layout {
            grid-template-rows: 1fr 3rem;
            display: grid;
            > div:first-child {
                grid-row: 1/2;
            }
            & .close {
                grid-row: 2/3;
                align-self: flex-end;
                justify-self: end;
                padding: 0.5rem;
                > button {
                    padding: 0.5rem;
                    font-weight: bold;
                    background-color: rgba(255, 255, 255, 0.1);
                    border: rgba(255, 255, 255, 0.2);
                    color: white;
                    font-size: 1rem;
                }
            }
        }
    }
    & button,
    & input,
    & option,
    & select {
        font-size: 1rem;
    }
    & input,
    & select,
    & option {
        border-radius: 4px;
    }
    & .title {
        font-size: 2rem;
        grid-column: 1/3;
    }
    & a {
        text-shadow: 1px 0 5px rgba(192, 192, 255, 1);
        font-size: 20px;
        padding: 10px;
    }
`;

interface ModalProps extends SettingsProps {
    showModal: ModalType;
    setModal: (modal: ModalType) => void;
    settings: SettingsType;
    connections?: DataConnection[];
    onJoin: (room: string) => void;
}

export const Modal: FC<ModalProps> = ({ showModal, settings, connections, onJoin, setModal, ...settingsProps }) => {
    const onCloseSettings = useCallback(() => setModal(undefined), [setModal]);
    return (
        <ModalRoot style={{ visibility: !!showModal ? "visible" : "collapse" }}>
            <div className="center">
                <div className="modal-layout">
                    {showModal === "help" && <Welcome />}
                    {showModal === "settings" && <Settings settings={settings} {...settingsProps} />}
                    {showModal === "join" && (connections?.length || 0) === 0 && (
                        <Join name={settings.name} onJoin={onJoin} />
                    )}
                    <div className="close">
                        <button onClick={onCloseSettings}>Close</button>
                    </div>
                </div>
            </div>
        </ModalRoot>
    );
};
