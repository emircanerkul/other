// force the asyncify wasm variant: report JSPI as unavailable
export const jspi = async () => false;
export const bigInt = async () => true;
export const strings = async () => true;
export const bulkMemory = async () => true;
export const exceptions = async () => true;
export const mutableGlobals = async () => true;
export const threads = async () => false;
export const simd = async () => true;
export const relaxedSimd = async () => true;
export const tailCall = async () => true;
export const multiValue = async () => true;
export const referenceTypes = async () => true;
export const signExtension = async () => true;
export const saturatingTrunc = async () => true;
