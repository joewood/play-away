import { useEffect, useState } from "react";
import React, { FC } from "react";
import styled from "styled-components";

async function getRooms(): Promise<string[]> {
    const result = await fetch("https://play-away.azurewebsites.net/peerjs/playaway/peerjs/peers", { method: "GET" });
    if (result.ok) {
        return await result.json();
    } else {
        return [];
    }
}

export function useRooms() {
    const [rooms, setRooms] = useState<string[]>([]);
    useEffect(() => {
        getRooms().then(setRooms);
    }, []);
    return rooms;
}

const Root = styled.div`
    width: auto;
    height: auto;
    overflow: hidden;
    ul {
        margin: 2em;
        border: 3px solid #aaa;
        padding: 2em;
    }
    li {
        cursor: pointer;
        color: #aaa;
        list-style: none;
        text-align: center;
        padding: 5px;
        font-weight: bold;
    }
    li:hover {
        color: white;
    }
`;

export const Join: FC<{ name: string; onJoin: (room: string) => void }> = ({ name, onJoin }) => {
    const rooms = useRooms();
    return (
        <Root>
            <h1>PlayAway</h1>
            <p>The following rooms are currently active, select one to join:</p>
            <ul className="rooms">
                {rooms
                    .filter((r) => r !== name)
                    .map((room) => (
                        <li onClick={() => onJoin(room)}>{room}</li>
                    ))}
            </ul>
        </Root>
    );
};
