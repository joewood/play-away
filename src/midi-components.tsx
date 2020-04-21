import React, { FC } from "react";
import "react-piano/dist/styles.css";
import styled from "styled-components";
import { useMidi } from "./hooks";
import { PeerError } from "./use-peer";

const _StatusBar: FC<{
    error: PeerError | undefined;
    session: string;
    connected: boolean;
    connections: number;
    className?: string;
}> = ({ error, connected, connections, session, className }) => {
    const webMidi = useMidi();
    return (
        <div className={className}>
            <span>Web Midi Supported: {webMidi === undefined ? "Waiting" : webMidi === null ? "No" : "Enabled"}</span>
            {!!error && <span style={{ color: "red" }}>Error: error.type</span>}
            {!!session && <span>{`Session: ${session}`}</span>}
            {connected !== undefined && <span>{`Connected: ${connected}`}</span>}
            <span>{`Connections: ${connections}`}</span>
        </div>
    );
};
export const StatusBar = styled(_StatusBar)`
    background-color: #aaa;
    padding: 6px;
    flex: 0 0 auto;
    & > span {
        margin-right: 17px;
    }
`;
