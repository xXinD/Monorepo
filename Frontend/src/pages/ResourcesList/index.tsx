import { FC, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  Notification,
  Popconfirm,
  Select,
  Table,
  TableColumnProps,
  Tag,
} from "@arco-design/web-react";
import {
  IconDelete,
  IconPlus,
  IconSettings,
} from "@arco-design/web-react/icon";
import { useAsyncEffect } from "ahooks";
import styles from "../LiveList/index.module.less";
import {
  createResources,
  delResources,
  getResourcesList,
  Resources,
  updateResources,
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
    label: "视频",
    value: "video",
  },
  {
    label: "播放列表",
    value: "m3u8",
  },
  {
    label: "拉流地址",
    value: "pull_address",
  },
  {
    label: "音频",
    value: "audio",
  },
  {
    label: "图片",
    value: "Picture",
  },
];
const ResourcesList: FC = () => {
  const [data, setData] = useState([]);
  const [editVisible, setEditVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [editData, setEditData] = useState<Resources>();
  const [form] = Form.useForm();
  const queryList = async () => {
    const {
      data: { data: resourcesList },
    } = await getResourcesList();
    setData(resourcesList);
  };
  useAsyncEffect(async () => {
    await queryList();
  }, []);
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
            return <Tag color="#ff7d00">音频</Tag>;
          case "video":
            return <Tag color="#ff5722">视频</Tag>;
          case "Picture":
            return <Tag color="#b71de8">图片</Tag>;
          case "pull_address":
            return <Tag color="#168cff">转发流</Tag>;
          case "m3u8":
            return <Tag color="#509770">播放列表</Tag>;
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
              await delResources(_item.unique_id);
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
        label: "名称",
        field: "name",
        rules: [{ required: true }],
        type: "input",
        placeholder: "请输入名称",
      },
      {
        label: "文件路径 / 拉流地址",
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
            rowKey="unique_id"
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
        title={editData ? "编辑直播源" : "新建直播源"}
        visible={editVisible}
        confirmLoading={confirmLoading}
        onOk={async () => {
          setConfirmLoading(true);
          const values = form.getFieldsValue();
          values.update_date = new Date().getTime().toString();
          try {
            if (!editData) {
              await createResources(values as Resources);
            } else {
              values.unique_id = editData.unique_id;
              await updateResources(
                editData.unique_id as string,
                values as Resources
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
