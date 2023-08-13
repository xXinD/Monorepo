import { FC, useState } from "react";
import { Form, Input, Button, InputNumber, List } from "@arco-design/web-react";
import { observer } from "mobx-react-lite";
import styles from "./index.module.less";
import { postPlaylist } from "../../api/generalApi";
import WebSocketClient from "../../utils/wsClient";

const FormItem = Form.Item;
const Playlist: FC = observer(() => {
  const [form] = Form.useForm();
  const [taskLog, setTaskLog] = useState<string[]>([]);
  const wsHandler = (wsServer: string) => {
    const client = new WebSocketClient(wsServer);
    client
      .connect()
      .then(() => {
        client.receiveMessage((message) => {
          console.log("Received message:", message);
          setTaskLog((prev) => [message, ...prev]);
        });
      })
      .catch((error) => {
        console.error("Failed to connect:", error);
      });
  };
  return (
    <div className={styles.playlistWrapper}>
      <Form
        autoComplete="off"
        form={form}
        validateMessages={{
          required: (_, { label }) =>
            `${label.slice(0, label.length - 1)}不能为空`,
        }}
      >
        <FormItem
          field="sourcePath"
          label="源文件"
          rules={[{ required: true }]}
        >
          <Input placeholder="请输入待处理视频文件地址" />
        </FormItem>
        <FormItem
          field="segmentName"
          label="片段名称"
          rules={[{ required: true }]}
        >
          <Input placeholder="请输入片段名称" />
        </FormItem>

        <FormItem
          field="segmentDuration"
          label="片段时长"
          rules={[{ required: true }]}
        >
          <InputNumber placeholder="请输入播放列表片段时长" min={10} />
        </FormItem>

        <FormItem wrapperCol={{ offset: 5 }}>
          <Button
            type="primary"
            onClick={async () => {
              await form.validate();
              try {
                const values = form.getFieldsValue();
                const {
                  data: {
                    data: { wsServer },
                  },
                } = await postPlaylist(values);
                wsHandler(wsServer);
              } catch (e) {
                console.log(e);
              }
            }}
          >
            提交
          </Button>
        </FormItem>
      </Form>
      <List
        style={{ width: "70vw" }}
        virtualListProps={{
          height: 560,
        }}
        header="List title"
        dataSource={taskLog}
        render={(item, index) => <List.Item key={index}>{item}</List.Item>}
      />
    </div>
  );
});
export default Playlist;
