/// <reference types="react-scripts" />

declare module "react-piano";
declare module "react-use-dimensions";
declare module "react-use-input" {
    function useInput(defaut: string | undefined, valueKey = "value"): [string, (event: any) => void];
    export default useInput;
}

declare module "use-persisted-state" {
    type UseFunc<T> = (defaultValue: T) => [T, Dispatch<SetStateAction<T>>];
    export default function createPersistedState<T = any>(name: string): UseFunc<T>;
}
