import React, { useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Popconfirm,
  Table,
  TableColumnProps,
  Input,
  Select,
  Tag,
  Notification,
} from "@arco-design/web-react";
import {
  IconDelete,
  IconPlus,
  IconSettings,
} from "@arco-design/web-react/icon";
import { useAsyncEffect } from "ahooks";
import styles from "../LiveList/index.module.less";
import { delLiveStream, getLiveStreamingList } from "../../api/liveApi";
import { LiveOptions } from "../LiveList";
import {
  createLiveStream,
  getResourcesList,
  Resources,
} from "../../api/resourcesApi";
import { timestampToTime } from "../../utils/format";

const FormItem = Form.Item;
const { Option } = Select;
interface FormItemData {
  label: string;
  field: string;
  rules?: any[];
  type: string;
  placeholder?: string;
  options?: any[];
  defaultValue?: any;
}
const fileTypeOptions = [
  {
    label: "音频",
    value: "audio",
  },
  {
    label: "视频",
    value: "video",
  },
];
const ResourcesList: React.FC = () => {
  const [data, setData] = React.useState([]);
  const [editVisible, setEditVisible] = React.useState(false);
  const [confirmLoading, setConfirmLoading] = React.useState(false);
  const [editData, setEditData] = useState<LiveOptions>();
  const [form] = Form.useForm();
  const columns: TableColumnProps[] = [
    {
      title: "名称",
      dataIndex: "name",
    },
    {
      title: "资源路径",
      dataIndex: "video_dir",
      width: "15%",
      ellipsis: true,
    },
    {
      title: "文件类型",
      dataIndex: "file_type",
      render: (text) => {
        switch (text) {
          case "audio":
            return <Tag color="#ff7d00">Audio</Tag>;
          case "video":
            return <Tag color="#ff5722">Video</Tag>;
          case "Picture":
            return <Tag color="#b71de8">Picture</Tag>;
          default:
            return <Tag color="#7816ff">Unknown</Tag>;
        }
      },
    },
    {
      title: "更新日期",
      dataIndex: "update_date",
      render: (text) => <span>{timestampToTime(Number(text))}</span>,
    },
    {
      title: "操作",
      dataIndex: "Operation",
      width: 150,
      render: (_, _item) => (
        <div className={styles.operation}>
          <Button
            shape="round"
            type="text"
            icon={<IconSettings />}
            onClick={() => {}}
          />
          <Popconfirm
            focusLock
            title="停止&删除"
            content="确认停止&删除当前直播吗？"
            onOk={async () => {
              await delLiveStream(_item.unique_id);
              const { data: liveSteams } = await getLiveStreamingList();
              setData(liveSteams);
            }}
          >
            <Button shape="round" type="text" icon={<IconDelete />} />
          </Popconfirm>
        </div>
      ),
    },
  ];
  const formItemData = useMemo(
    () => [
      {
        label: "名称",
        field: "name",
        rules: [{ required: true }],
        type: "input",
        placeholder: "请输入名称",
      },
      {
        label: "文件路径",
        field: "video_dir",
        rules: [{ required: true }],
        type: "input",
        placeholder: "请输入文件路径",
      },
      {
        label: "文件类型",
        field: "file_type",
        rules: [{ required: true }],
        type: "select",
        options: fileTypeOptions,
        placeholder: "请输入文件类型",
      },
    ],
    [editVisible],
  );
  const queryList = async () => {
    const {
      data: { data: resourcesList },
    } = await getResourcesList();
    setData(resourcesList);
  };
  useAsyncEffect(async () => {
    await queryList();
  }, []);
  const getFormElement = (item: FormItemData) => {
    switch (item.type) {
      case "input":
        return <Input placeholder={item.placeholder} />;
      case "select":
        return (
          item.options && (
            <Select placeholder={item.placeholder} allowClear>
              {item.options.map((option) => (
                <Option key={option.label} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          )
        );
      default:
        return <Input placeholder={item.placeholder} />;
    }
  };
  const formItemRender = useMemo(
    () => formItemData.map((item: FormItemData) => (
      <FormItem
        key={item.field}
        field={item.field}
        label={item.label}
        rules={item.rules}
      >
        {getFormElement(item)}
      </FormItem>
    )),
    [editVisible],
  );

  const addData = () => {
    form.resetFields();
    setEditData(undefined);
    setEditVisible(true);
  };

  return (
    <>
      <div>
        <Button
          shape="circle"
          type="primary"
          icon={<IconPlus />}
          onClick={() => addData()}
        />
        {data && (
          <Table
            key="unique_id"
            columns={columns}
            data={data}
            style={{ marginTop: 10 }}
          />
        )}
      </div>
      <Drawer
        unmountOnExit
        className={styles.drawerWrapper}
        width="30%"
        title={<span>Basic Information </span>}
        visible={editVisible}
        confirmLoading={confirmLoading}
        onOk={async () => {
          setConfirmLoading(true);
          const values = form.getFieldsValue();
          values.update_date = new Date().getTime().toString();
          try {
            await createLiveStream(values as Resources);
            await queryList();
            setEditVisible(false);
          } catch (e:any) {
            Notification.error({
              title: "接口错误",
              content: e,
            });
          }
          setConfirmLoading(false);
        }}
        onCancel={() => {
          setEditVisible(false);
        }}
      >
        <Form autoComplete="off" layout="vertical" form={form}>
          {formItemRender}
        </Form>
      </Drawer>
    </>
  );
};

export default ResourcesList;
