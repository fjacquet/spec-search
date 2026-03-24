import { createContext, useContext } from "react";
import { DEFAULT_SUITE, getSuite } from "../constants/suites.js";

export const SuiteContext = createContext(getSuite(DEFAULT_SUITE));

/** Get the active suite config from context. */
export function useSuite() {
  return useContext(SuiteContext);
}
