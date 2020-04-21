/// <reference types="react-scripts" />

declare module "react-piano";
declare module "react-use-dimensions";
declare module "react-use-input" {
    function useInput(defaut: string | undefined, valueKey = "value"): [string, (event: any) => void];
    export default useInput;
}
