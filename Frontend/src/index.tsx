import React from "react";
import ReactDOM from "react-dom";
import rootStore, { StoreContext } from "./store";
import App from "./App";
import "@arco-design/web-react/dist/css/index.less";

document.body.setAttribute("arco-theme", "dark");
ReactDOM.render(
  <StoreContext.Provider value={rootStore}>
    <App />
  </StoreContext.Provider>,
  document.getElementById("root"),
);
