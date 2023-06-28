import { makeAutoObservable } from "mobx";

class StreamStore {
  userSettings: any = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setUserSettings(payload: any) {
    this.userSettings = payload;
  }
}

export default StreamStore;
