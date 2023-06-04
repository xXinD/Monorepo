import React, { useMemo, useState } from "react";
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
  Upload,
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
  streamingAddress: string;
  // 推流密钥
  streamingCode: string;
  // 房间地址
  roomAddress?: string;
  // 视频文件所在目录
  videoDir?: string;
  video_dir?: string;
  // 编码器
  encoder?: string;
  // 是否开启硬件加速
  isItHardware?: boolean | number;
  // 码率模式
  encodingMode: number;
  // 码率值
  bitRateValue: number;
  // 分辨率
  resolvingPower?: string;
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
const LiveList: React.FC = () => {
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [data, setData] = useState();
  const [editData, setEditData] = useState<LiveOptions>();
  const [form] = Form.useForm();
  const [editVisible, setEditVisible] = useState(false);
  const columns: TableColumnProps[] = [
    {
      title: "名称",
      dataIndex: "name",
    },
    {
      title: "推流地址",
      dataIndex: "streamingAddress",
      width: "10%",
      ellipsis: true,
    },
    {
      title: "推流码",
      dataIndex: "streamingCode",
      width: "10%",
      ellipsis: true,
    },
    {
      title: "房间地址",
      dataIndex: "roomAddress",
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
      dataIndex: "isItHardware",
      render: (text) => (text ? (
        <IconCheckCircleFill className={styles.icon_running} />
      ) : (
        <IconStop className={styles.icon_stop} />
      )),
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
      dataIndex: "encodingMode",
      render: (text) => (text === "1" ? (
        <Tag color="#b71de8">固定码率</Tag>
      ) : (
        <Tag color="#7816ff">动态码率范围</Tag>
      )),
    },
    {
      title: "码率值",
      dataIndex: "bitRateValue",
      render: (text) => `${text}kbps`,
    },
    {
      title: "分辨率",
      dataIndex: "resolvingPower",
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
            onClick={() => {
              form.resetFields();
              form.setFieldsValue(_item);
              setEditData(_item);
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
                } catch (e:any) {
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
                } catch (e:any) {
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
  const formItemData = useMemo(() => [
    {
      label: "名称",
      field: "name",
      rules: [{ required: true }],
      type: "input",
      placeholder: "请输入名称",
    },
    {
      label: "推流地址",
      field: "streamingAddress",
      rules: [{ required: true }],
      type: "input",
      placeholder: "请输入推流地址",
    },
    {
      label: "推流码",
      field: "streamingCode",
      rules: [{ required: true }],
      type: "input",
      placeholder: "请输入推流码",
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
      label: "房间地址",
      field: "roomAddress",
      rules: [{ required: true }],
      type: "input",
      placeholder: "请输入房间地址",
    },
    {
      label: "硬件加速",
      field: "isItHardware",
      rules: [{ required: true }],
      type: "switch",
      defaultValue: editData?.isItHardware,
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
      field: "encodingMode",
      rules: [{ required: true }],
      type: "select",
      options: encodingModeOptions,
      placeholder: "请选择码率模式",
    },
    {
      label: "码率值",
      field: "bitRateValue",
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
      field: "startStreamingTime",
      type: "timePicker",
      placeholder: "请输入开始推流的时间（例如：00:10:00）",
    },
  ], [editData, editVisible]);
  useAsyncEffect(async () => {
    const { data: liveSteams } = await getLiveStreamingList();
    setData(liveSteams);
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
        return <Switch defaultChecked={editData ? item.defaultValue === 1 : false} />;
      case "select":
        return (
          item.options && (
            <Select placeholder={item.placeholder} allowClear>
              {item.options.map((option) => (
                <Option
                  key={option.label}
                  value={option.value}
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
      case "chooseFile":
        return (
          <Upload
            drag
            multiple
            autoUpload={false}
            accept="video/*"
            defaultFileList={item.defaultValue ? [{
              uid: item.defaultValue,
              url: item.defaultValue,
              name: item.defaultValue,
            }] : []}
            onDrop={(e) => {
              const uploadFile = e.dataTransfer.files[0];
            }}
          />
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
    [editData, editVisible],
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
        title={<span>Basic Information </span>}
        visible={editVisible}
        confirmLoading={confirmLoading}
        onOk={async () => {
          setConfirmLoading(true);
          const values = form.getFieldsValue();
          if (typeof values.isItHardware === "boolean") {
            values.isItHardware = values.isItHardware ? 1 : 2;
          }
          try {
            if (editData) {
              await updateLiveStream(editData.unique_id as string, values);
            } else {
              await createLiveStream(values);
            }
            const { data: liveSteams } = await getLiveStreamingList();
            setData(liveSteams);
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

export default LiveList;
