import React from "react";
import LiveList from "../pages/LiveList";
import VideoList from "../pages/ResourcesList";
import StreamList from "../pages/StreamList";
import Setting from "../pages/Setting";

export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  isProtected?: boolean;
}
const routes = [
  {
    path: "/live-list",
    component: LiveList,
    exact: true,
    isProtected: false,
  },
  {
    path: "/video-list",
    component: VideoList,
    exact: true,
    isProtected: false,
  },
  {
    path: "/stream-list",
    component: StreamList,
    exact: true,
    isProtected: false,
  },
  {
    path: "/setting",
    component: Setting,
    exact: true,
    isProtected: false,
  },
];
export default routes;
