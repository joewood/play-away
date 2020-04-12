# Play Away

This simple page is a peer to peer open-source music playing page to help support efforts of social distancing for Corvid19. It is a total serverless solution, other than the metadata service [PeerJS](https://peerjs.com)

**This site is running at [play-away.netlify.com](https://play-away.netlify.com/)**

## Current Features

This is work in progress weekend experiment, the current features are:

-   Play music using the onscreen keyboard (mouse or keyboard)
-   Select from a variety of sound fonts
-   Send generated link to connect another computer
-   Complete bidirectional playing - near realtime
-   Attach a midi input device and play using a different instrument

## Ideas for future improvements:

-   Optionally include audio / video streams
-   Send a metronome beat
-   Record and playback the midi-stream
-   Record the audio stream

## Credits

This initial prototype only took a few hours because it was built with some great technology:

-   [PeerJS](https://peerjs.com) with it's JavaScript client library for abstracting WebRTC
-   [Soundfont-player](https://github.com/danigb/soundfont-player) and [Midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts)
-   [React Piano](https://github.com/kevinsqi/react-piano) for the on-screen piano keyboard
