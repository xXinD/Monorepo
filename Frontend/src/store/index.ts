import { createContext, useContext } from "react";
import UserStore from "./userStore";

class RootStore {
  userStore: UserStore;

  constructor() {
    this.userStore = new UserStore();
  }
}

const rootStore = new RootStore();
export const StoreContext = createContext(rootStore);
export const useStore = (): RootStore => useContext(StoreContext);
export default rootStore;
