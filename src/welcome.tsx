import * as React from "react";
import { FC } from "react";

export const Welcome: FC<{}> = () => {
    return (
        <div>
            <h1>PlayAway</h1>
            <p>
                This simple page is a peer to peer open-source music playing page to help support efforts of social
                distancing for Corvid19. It is a total serverless solution, other than the metadata service{" "}
                <a href="https://peerjs.com" target="__blank">
                    PeerJS
                </a>{" "}
            </p>
            <p>
                To use, simply send the link to this site to another user. They can identify themselves by setting them
                name in the settings dialog.
            </p>

            <p>This is work in progress weekend experiment, the current features are:</p>
            <ul>
                <li>Play music using the onscreen keyboard (mouse or keyboard)</li>
                <li>Select from a variety of sound fonts</li>
                <li>Send generated link to connect another computer</li>
                <li>Complete bidirectional playing - near realtime</li>
                <li>Attach a midi input device and play using a different instrument</li>
            </ul>
            <p>Ideas for future improvements:</p>
            <ul>
                <li>Optionally include audio / video streams</li>
                <li>Send a metronome beat</li>
                <li>Record and playback the midi-stream</li>
                <li>Record the audio stream</li>
            </ul>
            <p>This initial prototype only took a few hours because it was built with some great technology:</p>
            <ul>
                <li>
                    {" "}
                    <a href="https://peerjs.com" target="__blank">
                        PeerJS
                    </a>{" "}
                    with it's JavaScript client library for abstracting WebRTC
                </li>
                <li>
                    <a href="https://github.com/danigb/soundfont-player" target="__blank">
                        Soundfont-player
                    </a>{" "}
                    and{" "}
                    <a href="https://github.com/gleitz/midi-js-soundfonts" target="__blank">
                        Midi-js-soundfonts
                    </a>
                </li>
                <li>
                    <a href="https://github.com/kevinsqi/react-piano" target="__blank">
                        React Piano
                    </a>{" "}
                    for the on-screen piano keyboard
                </li>
            </ul>
            <p>
                <b>The sourcecode is here, MIT license:{"  "}</b>
                <a href="https://github.com/joewood/play-away" target="__blank">
                    Github/joewood/play-away
                </a>
            </p>
        </div>
    );
};
