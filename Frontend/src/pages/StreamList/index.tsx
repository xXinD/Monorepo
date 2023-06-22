import { FC, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  Link,
  Notification,
  Popconfirm,
  Select,
  Switch,
  Table,
  TableColumnProps,
} from "@arco-design/web-react";
import {
  IconCheckCircleFill,
  IconDelete,
  IconPlus,
  IconSettings,
  IconStop,
} from "@arco-design/web-react/icon";
import { useAsyncEffect } from "ahooks";
import styles from "../LiveList/index.module.less";
import {
  createStreamAddress,
  delStreamAddress,
  getStreamAddressList,
  StreamAddress,
  updateStreamAddress,
} from "../../api/streamAddressApi";
import { timestampToTime } from "../../utils/format";

const FormItem = Form.Item;
const { TextArea } = Input;

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
export const platformOptions = [
  {
    label: "虎牙",
    value: "huya",
  },
  {
    label: "哔哩哔哩",
    value: "bilibili",
  },
  {
    label: "斗鱼",
    value: "douyu",
  },
  {
    label: "快手",
    value: "kuaishou",
  },
  {
    label: "抖音",
    value: "douyin",
  },
  {
    label: "YouTube",
    value: "youtube",
  },
  {
    label: "Twitch",
    value: "twitch",
  },
];
const ResourcesList: FC = () => {
  const [data, setData] = useState([]);
  const [editVisible, setEditVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [editData, setEditData] = useState<StreamAddress>();
  const [form] = Form.useForm();
  const queryList = async () => {
    const {
      data: { data: resourcesList },
    } = await getStreamAddressList();
    setData(resourcesList);
  };
  useAsyncEffect(async () => {
    await queryList();
  }, []);
  const columns: TableColumnProps[] = [
    {
      title: "平台",
      dataIndex: "platform",
      render: (text) =>
        platformOptions.find((item) => item.value === text)?.label || text,
    },
    {
      title: "直播地址",
      dataIndex: "streaming_address",
    },
    {
      title: "直播码",
      dataIndex: "streaming_code",
      width: "10%",
      ellipsis: true,
    },
    {
      title: "房间地址",
      dataIndex: "room_address",
      render: (text) => (
        <Link href={text} target="_blank">
          {text}
        </Link>
      ),
    },
    {
      title: "自动开播",
      dataIndex: "start_broadcasting",
      render: (text) =>
        text === 1 ? (
          <IconCheckCircleFill className={styles.icon_running} />
        ) : (
          <IconStop className={styles.icon_stop} />
        ),
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
            onClick={() => {
              form.resetFields();
              form.setFieldsValue(_item);
              setEditData(_item);
              setEditVisible(true);
            }}
          />
          <Popconfirm
            focusLock
            title="停止&删除"
            content="确认停止&删除当前直播吗？"
            onOk={async () => {
              await delStreamAddress(_item.unique_id);
              await queryList();
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
        label: "平台",
        field: "platform",
        rules: [{ required: true }],
        type: "select",
        options: platformOptions,
        placeholder: "请选择平台",
      },
      {
        label: "直播地址",
        field: "streaming_address",
        rules: [{ required: true }],
        type: "input",
        placeholder: "请输入直播地址",
      },
      {
        label: "直播码",
        field: "streaming_code",
        rules: [{ required: true }],
        type: "input",
        placeholder: "请输入直播码",
      },
      {
        label: "房间地址",
        field: "room_address",
        rules: [{ required: true }],
        type: "input",
        placeholder: "请输入房间地址",
      },
      {
        label: "自动开播",
        field: "start_broadcasting",
        rules: [{ required: true }],
        type: "switch",
        defaultValue: editData?.start_broadcasting,
      },
      {
        label: "备注",
        field: "description",
        type: "textArea",
        defaultValue: editData?.description,
      },
    ],
    [editVisible]
  );
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
      case "switch":
        return (
          <Switch defaultChecked={editData ? item.defaultValue === 1 : false} />
        );
      case "textArea":
        return (
          <TextArea
            placeholder="请输入备注"
            autoSize={{ minRows: 2, maxRows: 6 }}
            allowClear
          />
        );
      default:
        return <Input placeholder={item.placeholder} />;
    }
  };
  const formItemRender = useMemo(
    () =>
      formItemData.map((item: FormItemData) => (
        <FormItem
          key={item.field}
          field={item.field}
          label={item.label}
          rules={item.rules}
        >
          {getFormElement(item)}
        </FormItem>
      )),
    [editVisible]
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
        title="新建推流"
        className={styles.drawerWrapper}
        width="30%"
        visible={editVisible}
        confirmLoading={confirmLoading}
        onOk={async () => {
          setConfirmLoading(true);
          const values = form.getFieldsValue();
          values.update_date = new Date().getTime().toString();
          try {
            if (!editData) {
              await createStreamAddress(values as StreamAddress);
            } else {
              values.unique_id = editData.unique_id;
              await updateStreamAddress(
                editData.unique_id as string,
                values as StreamAddress
              );
            }
            await queryList();
            setEditVisible(false);
          } catch (e: any) {
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
