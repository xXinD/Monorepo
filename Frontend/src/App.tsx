import { FC, useMemo, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Link, Menu, PageHeader } from "@arco-design/web-react";
import { IconLiveBroadcast } from "@arco-design/web-react/icon";
import { useAsyncEffect } from "ahooks";
import routes from "./router";
import RenderRoutes from "./router/RenderRoutes";
import styles from "./index.module.less";
import { getServerConfig } from "./api/generalApi";
import Setting from "./pages/Setting";
import "./reset.less";
import { useStore } from "./store";

const MenuItem = Menu.Item;
const { SubMenu } = Menu;
const App: FC = () => {
  const [menuData, setMenuData] = useState([
    {
      key: "1",
      name: "直播管理",
      icon: <IconLiveBroadcast />,
      children: [
        {
          key: "1_1",
          name: "房间管理",
          path: "/live-list",
        },
        {
          key: "1_2",
          name: "直播源管理",
          path: "video-list",
        },
        {
          key: "1_3",
          name: "推流地址管理",
          path: "stream-list",
        },
        {
          key: "1_4",
          name: "设置",
          path: "setting",
        },
      ],
    },
  ]) as any[];
  const menuRender = useMemo(
    () =>
      menuData.map((item: any) => (
        <SubMenu
          key={item.key}
          title={
            <>
              {item.icon}
              {item.name}
            </>
          }
        >
          {item.children
            ? item.children.map((child: any) => (
                <MenuItem key={child.key}>
                  <Link hoverable={false} href={child.path}>
                    {child.name}
                  </Link>
                </MenuItem>
              ))
            : null}
        </SubMenu>
      )),
    [menuData]
  );
  return (
    <Router>
      <div className={styles.main}>
        <PageHeader
          style={{ background: "var(--color-bg-2)" }}
          title="小信"
          subTitle="管理平台"
        />
        <div className={styles.wrapper}>
          <div className="menu-demo">
            <Menu
              style={{ width: 200, height: "100%" }}
              hasCollapseButton
              defaultOpenKeys={["0"]}
              defaultSelectedKeys={["0_1"]}
            >
              {menuRender}
            </Menu>
          </div>
          <div className={styles.contentWrapper}>
            <RenderRoutes routes={routes} />
          </div>
        </div>
      </div>
    </Router>
  );
};

const Page: FC = () => {
  const { streamStore } = useStore();
  const [pageState, setPageState] = useState(localStorage.pageState);
  useAsyncEffect(async () => {
    const {
      data: {
        data: { config, data },
      },
    } = await getServerConfig();
    setPageState(config);
    streamStore.setUserSettings(data);
  }, []);
  return pageState === 1 ? <App /> : <Setting />;
};
export default Page;
