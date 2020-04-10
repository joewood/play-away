import React, { FC, useRef, useCallback, useState, useEffect } from "react";
import "./App.css";
import { useMidi } from "./hooks";
import { MidiSelect, MidiStatus } from "./midi-components";

const App: FC<{}> = ({}) => {
    const [state, setState] = useState("play" + Math.round(Math.random() * 100));
    const webMidi = useMidi();
    const changeNane = useCallback((event: any) => {
        setState(event.target.value);
    }, []);
    return (
        <div className="App">
            <header className="App-header">
                <a href="/">Play Away</a>
            </header>
            <div key="name" className="row">
                <label>
                    <span>Session Name</span>
                    <input name="name" onChange={changeNane} value={state} type="text" />
                </label>
            </div>
            <div key="server" className="row">
                <p>
                    To be the player <a href={"/?server=" + state}>Click Here</a>
                </p>
            </div>
            <div key="follower" className="row">
                <p>
                    To be the follower <a href={"/?broker=" + state}>Click Here</a>
                </p>
            </div>
            <div key="WebMidi" className="row">
                <MidiSelect onInputSelect={(inputs) => {}} />
            </div>
            <div className="status">
                <MidiStatus />
                <span>Session Name: state</span>
            </div>
        </div>
    );
};

export default App;
