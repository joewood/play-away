import { useCallback, useEffect, useState, useMemo } from "react";
import createPersistedState from "use-persisted-state";

export function useMediaDevices(): MediaDeviceInfo[] {
    const [devices, setDevices] = useState<MediaDeviceInfo[]>();
    const onDeviceChange = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            setDevices(devices);
        } catch (err) {
            console.error(err);
            setDevices([]);
        }
    }, [setDevices]);
    useEffect(() => {
        if (devices === undefined) onDeviceChange();
    }, [devices, onDeviceChange]);
    useEffect(() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("getUserMedia not supported on your browser!");
            return;
        }
        navigator.mediaDevices.addEventListener("devicechange", onDeviceChange);
        return () => navigator.mediaDevices.removeEventListener("devicechange", onDeviceChange);
    }, [onDeviceChange]);
    return devices || [];
}

export function isVideoOn(stream: MediaStream | undefined) {
    return stream && stream.getVideoTracks().every((m) => m.enabled);
}
function enableMicrophone(enabled: boolean, localStream: MediaStream) {
    if (!!localStream) {
        for (const track of localStream.getAudioTracks()) {
            track.enabled = enabled;
        }
    }
}

function enableCamera(enabled: boolean, localStream: MediaStream) {
    if (!!localStream) {
        for (const track of localStream.getVideoTracks()) {
            track.enabled = enabled;
        }
    }
}

const useMicrophoneState = createPersistedState<boolean>("microphone");
const useCameraState = createPersistedState<boolean>("camera");

interface UseMediaDevice {
    localStream: MediaStream | undefined;
    error: any;
    onMicrophoneOn: (on: boolean) => void;
    microphoneOn: boolean;
    onCameraOn: (on: boolean) => void;
    cameraOn: boolean;
}
/** Returns the best suited Media Device based on the constraints */
export function useMediaDevice(audioDeviceId: string | undefined, videoDeviceId: string | undefined): UseMediaDevice {
    const [localStream, setStream] = useState<MediaStream>();
    const [error, setError] = useState<any>();
    const [cameraOn, setCameraOn] = useCameraState(true);
    const [microphoneOn, setMicrophoneOn] = useMicrophoneState(true);
    const onSetStream = useCallback(
        (stream: MediaStream) => {
            enableMicrophone(microphoneOn, stream);
            enableCamera(cameraOn, stream);
            setStream(stream);
        },
        [cameraOn, microphoneOn, setStream]
    );
    const constraints = useMemo<MediaStreamConstraints>(() => {
        return {
            audio: audioDeviceId ? { deviceId: audioDeviceId } : true,
            video: videoDeviceId ? { deviceId: videoDeviceId, width: 150, height: 150 } : true,
        };
    }, [audioDeviceId, videoDeviceId]);

    useEffect(() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.log("getUserMedia not supported on your browser!");
            setError(null);
            return;
        }
        if (!!constraints.audio || !!constraints.video) {
            navigator.mediaDevices
                .getUserMedia(constraints)
                .then(onSetStream)
                .catch((err) => {
                    console.log("The following getUserMedia error occured: " + err);
                    setError(err);
                });
        } else {
            setStream(undefined);
        }
    }, [constraints, onSetStream, setError]);
    useEffect(() => {
        return () => {
            if (!!localStream) localStream.getTracks().forEach((t) => t.stop());
        };
    }, [localStream]);
    const onMicrophoneOn = useCallback(
        (on: boolean) => {
            if (!!localStream) {
                enableMicrophone(on, localStream);
                setMicrophoneOn(on);
            }
        },
        [setMicrophoneOn, localStream]
    );
    const onCameraOn = useCallback(
        (on: boolean) => {
            if (!!localStream) {
                enableCamera(on, localStream);
                setCameraOn(on);
            }
        },
        [setCameraOn, localStream]
    );
    const ret = useMemo(
        () => ({
            localStream,
            error,
            cameraOn,
            microphoneOn,
            onMicrophoneOn,
            onCameraOn,
        }),
        [localStream, onMicrophoneOn, cameraOn, microphoneOn, onCameraOn, error]
    );
    return ret;
}
