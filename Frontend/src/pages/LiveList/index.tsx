import { FC, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
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
  IconMinus,
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
import { getResourcesList } from "../../api/resourcesApi";
import {
  getStreamAddressList,
  StreamAddress,
} from "../../api/streamAddressApi";
import { platformOptions } from "../StreamList";
import { getRoomLink } from "../../utils/stringUtils";

const FormItem = Form.Item;
const { Option } = Select;
export interface LiveOptions {
  is_video_style?: boolean;
  unique_id?: string;
  uniqueId?: string;
  // 直播间 ID
  id?: string;
  platform?: string;
  // 直播状态
  state?: string;
  // 推流地址
  streaming_address: string;
  // 推流密钥
  streaming_code: string;
  // 房间ID
  room_id?: string;
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
  const [fileList, setFileList] = useState<any[]>([]);
  const [streamList, setStreamList] = useState<StreamAddress[]>([]);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [data, setData] = useState();
  const [editData, setEditData] = useState<LiveOptions>();
  const [form] = Form.useForm();
  const [editVisible, setEditVisible] = useState(false);
  const [isVideoStyle, setIsVideoStyle] = useState(2);
  const getFileList = async () => {
    const {
      data: { data: result },
    } = await getResourcesList();
    setFileList(result);
  };
  const columns: TableColumnProps[] = [
    {
      title: "名称",
      dataIndex: "title",
    },
    {
      title: "平台",
      dataIndex: "platform",
      width: "10%",
      render: (text) =>
        platformOptions.find((item) => item.value == text)?.label,
    },
    {
      title: "房间地址",
      dataIndex: "room_id",
      render: (text, _item) => (
        <Link href={getRoomLink(_item.platform, text)} target="_blank">
          {getRoomLink(_item.platform, text)}
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
            return "被封禁";
          default:
            return <IconCheckCircleFill className={styles.icon_running} />;
        }
      },
    },
    {
      title: "视频推流进度",
      dataIndex: "start_time",
    },
    {
      title: "硬件加速",
      dataIndex: "is_it_hardware",
      render: (text, _item) => {
        if (_item.is_video_style == 2) {
          return <IconMinus />;
        }
        return text === 1 ? (
          <IconCheckCircleFill className={styles.icon_running} />
        ) : (
          <IconStop className={styles.icon_stop} />
        );
      },
    },
    {
      title: "编码器",
      dataIndex: "encoder",
      render: (text, _item) => {
        if (_item.is_video_style == 2) {
          return <IconMinus />;
        }
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
      render: (text, _item) => {
        if (_item.is_video_style == 2) {
          return <IconMinus />;
        }
        return text === "1" ? (
          <Tag color="#b71de8">固定码率</Tag>
        ) : (
          <Tag color="#7816ff">动态码率范围</Tag>
        );
      },
    },
    {
      title: "码率值",
      dataIndex: "bit_rate_value",
      render: (text, _item) =>
        _item.is_video_style == 2 ? <IconMinus /> : `${text}kbps`,
    },
    {
      title: "分辨率",
      dataIndex: "resolving_power",
      render: (text, _item) =>
        _item.is_video_style == 2 ? <IconMinus /> : text,
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
              const stream = streamList.find(
                (item) => item.streaming_code === _item.streaming_code
              );
              form.setFieldsValue({
                ..._item,
                type: _item.fileType,
                stream: stream?.unique_id,
                pull_address: _item.video_dir,
              });
              setEditData(_item);
              setIsVideoStyle(_item.is_video_style);
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
                    content: e.message,
                  });
                }
              }}
            />
          ) : (
            <Button
              shape="round"
              type="text"
              disabled={_item.status == 2}
              icon={<IconPlayCircle />}
              onClick={async () => {
                try {
                  await startLiveStream(_item.unique_id);
                  const { data: liveSteams } = await getLiveStreamingList();
                  setData(liveSteams);
                } catch (e: any) {
                  Notification.error({
                    title: "接口错误",
                    content: e.message,
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
              try {
                await delLiveStream(_item.unique_id);
                const { data: liveSteams } = await getLiveStreamingList();
                setData(liveSteams);
              } catch (e: any) {
                Notification.error({
                  title: "接口错误",
                  content: e.message,
                });
              }
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
          label: `${formatPlatform?.label}-${item.title}`,
          value: item.unique_id,
        };
      }),
    [streamList]
  );
  const formItemData = useMemo(() => {
    const result: FormItemData[] = [
      {
        label: "开播房间",
        field: "stream_id",
        rules: [{ required: true }],
        type: "select",
        options: streamOptions,
        placeholder: "请选择开播房间",
      },
      {
        label: "直播源",
        field: "pull_address",
        rules: [{ required: true }],
        type: "select",
        options: fileList.map((item) => ({
          label: item.name,
          value: item.unique_id,
          srs_address: item.srs_address,
        })),
        placeholder: "请选择直播员",
      },
      {
        label: "自定义推流格式",
        field: "is_video_style",
        type: "switch",
        defaultValue: isVideoStyle,
      },
      {
        label: "开始推流的时间",
        field: "start_time",
        type: "input",
        placeholder: "请输入开始推流的时间（例如：00:10:00）",
      },
    ];
    if (isVideoStyle == 1) {
      result.push(
        {
          label: "硬件加速",
          field: "is_it_hardware",
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
          type: "numberInput",
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
        }
      );
    }
    return result;
  }, [editData, editVisible, fileList, isVideoStyle]);
  useAsyncEffect(async () => {
    const { data: liveSteams } = await getLiveStreamingList();
    const {
      data: { data: streams },
    } = await getStreamAddressList();
    setData(liveSteams);
    setStreamList(streams);
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
      case "numberInput":
        return <InputNumber placeholder={item.placeholder} />;
      case "switch":
        if (item.field === "is_video_style") {
          return (
            <Switch
              defaultChecked={isVideoStyle == 1}
              onChange={async (value) => {
                setIsVideoStyle(value ? 1 : 2);
              }}
            />
          );
        }
        return (
          <Switch defaultChecked={editData ? item.defaultValue === 1 : false} />
        );

      case "select":
        return (
          item.options && (
            <Select placeholder={item.placeholder} allowClear>
              {item.options.map((option) => (
                <Option
                  key={option.label}
                  value={option.value}
                  datatype={option.srs_address}
                >
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
      default:
        return <Input placeholder={item.placeholder} />;
    }
  };
  const formItemRender = useMemo(
    () =>
      formItemData &&
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
    [editData, editVisible, fileList, isVideoStyle]
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
        title={editData ? "编辑直播流" : "新建直播流"}
        visible={editVisible}
        confirmLoading={confirmLoading}
        afterOpen={async () => {
          await getFileList();
        }}
        onOk={async () => {
          try {
            await form.validate();
            setConfirmLoading(true);
            const values = form.getFieldsValue();
            values.video_dir = values.pull_address;
            delete values.pull_address;
            delete values.stream;
            values.is_video_style = isVideoStyle;
            try {
              console.log(values, "values");
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
          } catch (e) {
            console.error(e);
          }
        }}
        onCancel={() => {
          setEditVisible(false);
        }}
      >
        <Form
          autoComplete="off"
          layout="vertical"
          form={form}
          validateMessages={{
            required: (_, { label }) => `${label}不能为空`,
          }}
        >
          {formItemRender}
        </Form>
      </Drawer>
    </>
  );
};

export default LiveList;
