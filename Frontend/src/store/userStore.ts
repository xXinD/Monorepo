import { makeAutoObservable } from "mobx";

class UserStore {
  isLoggedIn = false;

  username = "";

  constructor() {
    makeAutoObservable(this);
  }

  login(username: string) {
    this.isLoggedIn = true;
    this.username = username;
  }

  logout() {
    this.isLoggedIn = false;
    this.username = "";
  }
}

export default UserStore;
