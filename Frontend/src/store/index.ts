import { createContext, useContext } from "react";
import StreamStore from "./streamStore";

class RootStore {
  streamStore: StreamStore;

  constructor() {
    this.streamStore = new StreamStore();
  }
}

const rootStore = new RootStore();
export const StoreContext = createContext(rootStore);
export const useStore = (): RootStore => useContext(StoreContext);
export default rootStore;
