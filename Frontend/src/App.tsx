import { FC, useMemo, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Link, Menu, PageHeader } from "@arco-design/web-react";
import { IconLiveBroadcast } from "@arco-design/web-react/icon";
import routes from "./router";
import RenderRoutes from "./router/RenderRoutes";
import styles from "./index.module.less";

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
          name: "影片管理",
          path: "video-list",
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

export default App;
