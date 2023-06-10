import { FC, useMemo, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import {
  Link,
  Menu,
  PageHeader,
  Form,
  Input,
  Button,
} from "@arco-design/web-react";
import { IconLiveBroadcast } from "@arco-design/web-react/icon";
import routes from "./router";
import RenderRoutes from "./router/RenderRoutes";
import styles from "./index.module.less";

const FormItem = Form.Item;
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
        {
          key: "1_3",
          name: "推流地址管理",
          path: "stream-list",
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
// Todo：新增初次进入站点，提示录入数据库、redis、后端服务地址等信息。
const PreMade: FC = () => (
  <Form style={{ width: 600 }} autoComplete="off">
    <FormItem label="Username">
      <Input placeholder="please enter your username..." />
    </FormItem>
    <FormItem label="Post">
      <Input placeholder="please enter your post..." />
    </FormItem>
    <FormItem wrapperCol={{ offset: 5 }}>
      <Button type="primary">Submit</Button>
    </FormItem>
  </Form>
);
export default App;
