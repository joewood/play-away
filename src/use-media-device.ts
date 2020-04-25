import { useCallback, useEffect, useState } from "react";

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

/** Returns the best suited Media Device based on the constraints */
export function useMediaDevice(constraints: MediaStreamConstraints): [MediaStream | undefined, any] {
    const [stream, setStream] = useState<MediaStream>();
    const [error, setError] = useState<any>();
    useEffect(() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.log("getUserMedia not supported on your browser!");
            setError(null);
            return;
        }
        if (!!constraints.audio || !!constraints.video) {
            console.log("Media Constraints");
            navigator.mediaDevices
                .getUserMedia(constraints)
                .then(setStream)
                .catch((err) => {
                    console.log("The following getUserMedia error occured: " + err);
                    setError(err);
                });
        } else {
            setStream(undefined);
        }
    }, [setStream, constraints, setError]);
    useEffect(() => {
        return () => {
            if (!!stream) stream.getTracks().forEach((t) => t.stop());
        };
    }, [stream]);
    return [stream, error];
}
