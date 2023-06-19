import { makeAutoObservable } from "mobx";

class StreamStore {
  userSettings: any = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setUserSettings(payload: any) {
    this.userSettings = payload;
    console.log(this.userSettings, 3333);
  }
}

export default StreamStore;
