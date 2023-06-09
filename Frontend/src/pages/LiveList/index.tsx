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
  Tag,
  TimePicker,
} from "@arco-design/web-react";
import {
  IconCheckCircleFill,
  IconCloseCircle,
  IconDelete,
  IconInfoCircleFill,
  IconPlayCircle,
  IconPlus,
  IconRecordStop,
  IconSettings,
  IconStop,
} from "@arco-design/web-react/icon";
import { useAsyncEffect } from "ahooks";
import styles from "./index.module.less";
import {
  createLiveStream,
  delLiveStream,
  getLiveStreamingList,
  startLiveStream,
  stopLiveStream,
  updateLiveStream,
} from "../../api/liveApi";
import {
  getResourcesByFileType,
  getResourcesFileTypes,
} from "../../api/resourcesApi";
import {
  getStreamAddressList,
  StreamAddress,
} from "../../api/streamAddressApi";
import { platformOptions } from "../StreamList";

const FormItem = Form.Item;
const { Option } = Select;
export interface LiveOptions {
  unique_id?: string;
  uniqueId?: string;
  // 直播间 ID
  id?: string;
  platform?: string;
  // 直播名称
  name: string;
  // 直播状态
  state?: string;
  // 推流地址
  streaming_address: string;
  // 推流密钥
  streaming_code: string;
  // 房间地址
  room_address?: string;
  // 视频文件所在目录
  video_dir?: string;
  fileType?: string;
  file_name?: string;
  // 编码器
  encoder?: string;
  // 是否开启硬件加速
  is_it_hardware?: boolean | number;
  // 码率模式
  encoding_mode: number;
  // 码率值
  bit_rate_value: number;
  // 分辨率
  resolving_power?: string;
  // 音轨
  audioTrack?: string;
  // 字幕
  subtitleTrack?: string;
  // 开始推流时间
  startStreamingTime?: string;
  // 是否启用水印，默认不启用
  watermarkEnabled?: boolean;
  // 水印图片路径
  watermarkImg?: string;
  // 水印图片宽度
  watermarkWidth?: number;
  // 请选择水印位置：1.左上角 2.左下角 3.右上角 4.右下角
  watermarkPosition?: number;
  // 转场效果类型：1.简单 2.复杂，默认无转场效果
  transitionType?: number;
  // 选择简单转场效果：1.淡入淡出fade 2.滑动slide 3.推移push"
  simpleTransition?: number;
  // 选择复杂转场效果：1.旋转circleopen 2.缩放radial 3.翻转flip 4.溶解dissolve"
  complexTransition?: number;
}
const encoderOptions = [
  {
    label: "H.264",
    value: "h264",
  },
  {
    label: "HEVC",
    value: "hevc",
  },
];
const encodingModeOptions = [
  {
    label: "固定码率",
    value: 1,
  },
  {
    label: "动态码率范围",
    value: 2,
  },
];
interface FormItemData {
  label: string;
  field: string;
  rules?: any[];
  type: string;
  placeholder?: string;
  options?: any[];
  defaultValue?: any;
}
const LiveList: FC = () => {
  const [fileTypes, setFileTypes] = useState<any[]>([]);
  const [fileList, setFileList] = useState<any[]>([]);
  const [streamList, setStreamList] = useState<StreamAddress[]>([]);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [data, setData] = useState();
  const [editData, setEditData] = useState<LiveOptions>();
  const [form] = Form.useForm();
  const [editVisible, setEditVisible] = useState(false);
  const getFileList = async (value: string) => {
    const {
      data: { data: result },
    } = await getResourcesByFileType(value);
    setFileList(result);
  };
  const columns: TableColumnProps[] = [
    {
      title: "名称",
      dataIndex: "name",
    },
    {
      title: "推流地址",
      dataIndex: "streaming_address",
      width: "10%",
      ellipsis: true,
    },
    {
      title: "推流码",
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
      title: "状态",
      dataIndex: "status",
      render: (text) => {
        switch (text) {
          case 0:
            return <IconCheckCircleFill className={styles.icon_running} />;
          case 1:
            return <IconCloseCircle className={styles.icon_warning} />;
          case 2:
            return <IconInfoCircleFill className={styles.icon_stop} />;
          default:
            return <IconCheckCircleFill className={styles.icon_running} />;
        }
      },
    },
    {
      title: "硬件加速",
      dataIndex: "is_it_hardware",
      render: (text) =>
        text === 1 ? (
          <IconCheckCircleFill className={styles.icon_running} />
        ) : (
          <IconStop className={styles.icon_stop} />
        ),
    },
    {
      title: "编码器",
      dataIndex: "encoder",
      render: (text) => {
        switch (text) {
          case "H.264":
            return <Tag color="#ff7d00">H.264</Tag>;
          case "HEVC":
            return <Tag color="#ff5722">HEVC</Tag>;
          default:
            return <Tag color="#ff7d00">H.264</Tag>;
        }
      },
    },
    {
      title: "码率模式",
      dataIndex: "encoding_mode",
      render: (text) =>
        text === "1" ? (
          <Tag color="#b71de8">固定码率</Tag>
        ) : (
          <Tag color="#7816ff">动态码率范围</Tag>
        ),
    },
    {
      title: "码率值",
      dataIndex: "bit_rate_value",
      render: (text) => `${text}kbps`,
    },
    {
      title: "分辨率",
      dataIndex: "resolving_power",
    },
    {
      title: "音轨",
      dataIndex: "audioTrack",
      render: (text) => text || "默认",
    },
    {
      title: "字幕轨道",
      dataIndex: "subtitleTrack",
      render: (text) => text || "默认",
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
            onClick={async () => {
              form.resetFields();
              form.setFieldsValue(_item);
              setEditData(_item);
              await getFileList(_item.fileType);
              form.setFieldsValue({
                video_dir: {
                  type: _item.fileType,
                  name: _item.file_name,
                  path: _item.video_dir,
                },
              });
              setEditVisible(true);
            }}
          />
          {_item.status === 0 ? (
            <Button
              shape="round"
              type="text"
              icon={<IconRecordStop />}
              onClick={async () => {
                try {
                  await stopLiveStream(_item.unique_id);
                  const { data: liveSteams } = await getLiveStreamingList();
                  setData(liveSteams);
                } catch (e: any) {
                  Notification.error({
                    title: "接口错误",
                    content: e,
                  });
                }
              }}
            />
          ) : (
            <Button
              shape="round"
              type="text"
              icon={<IconPlayCircle />}
              onClick={async () => {
                try {
                  await startLiveStream(_item.unique_id);
                  const { data: liveSteams } = await getLiveStreamingList();
                  setData(liveSteams);
                } catch (e: any) {
                  Notification.error({
                    title: "接口错误",
                    content: e,
                  });
                }
              }}
            />
          )}
          <Popconfirm
            focusLock
            title="停止&删除"
            content="确认停止&删除当前直播吗？"
            onOk={async () => {
              console.log(_item, 111);
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
  const streamOptions = useMemo(
    () =>
      streamList.map((item) => {
        const formatPlatform = platformOptions.find(
          (_) => _.value === item.platform
        );
        return {
          label: `${formatPlatform?.label}-${item.description}`,
          value: item.unique_id,
        };
      }),
    [streamList]
  );
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
        label: "房间",
        field: "stream",
        rules: [{ required: true }],
        type: "select",
        options: streamOptions,
        placeholder: "请选择房间",
      },
      {
        label: "推流文件",
        field: "video_dir",
        rules: [{ required: true }],
        type: "chooseFile",
        placeholder: "请输入推流码",
        defaultValue: editData?.video_dir,
      },

      {
        label: "硬件加速",
        field: "is_it_hardware",
        rules: [{ required: true }],
        type: "switch",
        defaultValue: editData?.is_it_hardware,
      },
      {
        label: "编码器",
        field: "encoder",
        rules: [{ required: true }],
        type: "select",
        options: encoderOptions,
        placeholder: "请选择编码器",
      },
      {
        label: "码率模式",
        field: "encoding_mode",
        rules: [{ required: true }],
        type: "select",
        options: encodingModeOptions,
        placeholder: "请选择码率模式",
      },
      {
        label: "码率值",
        field: "bit_rate_value",
        rules: [{ required: true }],
        type: "input",
        placeholder: "请输入码率值",
      },
      {
        label: "音轨",
        field: "audioTrack",
        type: "input",
        placeholder: "请输入音轨（不输入则默认音轨）",
      },
      {
        label: "字幕轨道",
        field: "subtitleTrack",
        type: "input",
        placeholder: "请输入字幕轨道（不输入则默认字幕轨道）",
      },
      {
        label: "开始推流的时间",
        field: "start_time",
        type: "timePicker",
        placeholder: "请输入开始推流的时间（例如：00:10:00）",
      },
    ],
    [editData, editVisible]
  );
  useAsyncEffect(async () => {
    const { data: liveSteams } = await getLiveStreamingList();
    const {
      data: { data: fileTypesList },
    } = await getResourcesFileTypes();
    const {
      data: { data: streams },
    } = await getStreamAddressList();
    setData(liveSteams);
    setStreamList(streams);
    setFileTypes(fileTypesList);
  }, []);
  const addData = () => {
    form.resetFields();
    setEditData(undefined);
    setEditVisible(true);
  };

  const getFormElement = (item: FormItemData) => {
    switch (item.type) {
      case "input":
        return <Input placeholder={item.placeholder} />;
      case "switch":
        return (
          <Switch defaultChecked={editData ? item.defaultValue === 1 : false} />
        );
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
      case "timePicker":
        return (
          <TimePicker
            style={{ width: "100%" }}
            placeholder={item.placeholder}
          />
        );
      case "chooseFile":
        return (
          <div className={styles.cascade}>
            <Select
              placeholder="请选择文件类型"
              defaultValue={editData?.fileType}
              onChange={async (value) => {
                form.setFieldsValue({
                  video_dir: {
                    ...form.getFieldValue("video_dir"),
                    type: value,
                  },
                });
                await getFileList(value);
              }}
            >
              {fileTypes.map((option) => (
                <Option key={option} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="请选择文件"
              allowClear
              defaultValue={editData?.file_name}
              onChange={async (value: any, option: any) => {
                form.setFieldsValue({
                  video_dir: {
                    ...form.getFieldValue("video_dir"),
                    path: value,
                    // eslint-disable-next-line no-underscore-dangle
                    name: option.children,
                  },
                });
              }}
            >
              {fileList.map((option) => (
                <Option key={option.unique_id} value={option.video_dir}>
                  {option.name}
                </Option>
              ))}
            </Select>
          </div>
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
    [editData, editVisible, fileTypes, fileList]
  );
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
        title="新建直播"
        visible={editVisible}
        confirmLoading={confirmLoading}
        onOk={async () => {
          setConfirmLoading(true);
          const values = form.getFieldsValue();
          const stream = streamList.find(
            (item) => item.unique_id === values.stream
          );
          values.platform = stream?.platform;
          values.streaming_address = stream?.streaming_address;
          values.room_address = stream?.room_address;
          values.streaming_code = stream?.streaming_code;
          console.log(values, 11111);
          if (typeof values.is_it_hardware === "boolean") {
            values.is_it_hardware = values.is_it_hardware ? 1 : 2;
          }
          values.fileType = values.video_dir.type;
          values.file_name = values.video_dir.name;
          values.video_dir = values.video_dir.path;
          try {
            if (editData) {
              await updateLiveStream(editData.unique_id as string, values);
            } else {
              await createLiveStream(values);
            }
            const { data: liveSteams } = await getLiveStreamingList();
            setData(liveSteams);
            setEditVisible(false);
          } catch (e: any) {
            Notification.error({
              title: "接口错误",
              content: e.message,
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

export default LiveList;
