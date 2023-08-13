import React from "react";
import LiveList from "../pages/LiveList";
import VideoList from "../pages/ResourcesList";
import StreamList from "../pages/StreamList";
import Setting from "../pages/Setting";
import Watermark from "../pages/Watermark";
import Playlist from "../pages/Playlist";

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
  {
    path: "/watermark",
    component: Watermark,
    exact: true,
    isProtected: false,
  },
  {
    path: "/playlist",
    component: Playlist,
    exact: true,
    isProtected: false,
  },
];
export default routes;
