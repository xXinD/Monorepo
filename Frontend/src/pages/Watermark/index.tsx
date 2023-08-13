import { FC, useState, useRef } from "react";
import {
  Form,
  Radio,
  Input,
  Space,
  Button,
  Upload,
  InputNumber,
  Select,
} from "@arco-design/web-react";
import { observer } from "mobx-react-lite";
import { useAsyncEffect } from "ahooks";
import styles from "./index.module.less";
import { getFontList, postWatermarkToVideo } from "../../api/generalApi";

const { Option } = Select;
const FormItem = Form.Item;
const Watermark: FC = observer(() => {
  const [form] = Form.useForm();
  const uploadRef = useRef<any>();
  const [fontList, setFontList] = useState<any[]>([]);
  const [sourceFileList, setSourceFileList] = useState<any[]>([]);
  useAsyncEffect(async () => {
    const {
      data: { data },
    } = await getFontList();
    setFontList(data);
  }, []);
  return (
    <div className={styles.watermarkWrapper}>
      <Form
        autoComplete="off"
        form={form}
        validateMessages={{
          required: (_, { label }) =>
            `${label.slice(0, label.length - 1)}不能为空`,
        }}
      >
        <Form.Item field="outputPath" label="输出目录">
          <Input placeholder="输入输出路径" />
        </Form.Item>
        <FormItem field="sourceType" label="输入类型">
          <Radio.Group
            defaultValue="1"
            options={[
              {
                label: "文件夹",
                value: "1",
              },
              {
                label: "文件",
                value: "2",
              },
            ]}
          />
        </FormItem>
        <FormItem shouldUpdate noStyle>
          {(values) =>
            values.sourceType === "2" ? (
              <Form.Item field="source" label="待处理文件列表">
                <Upload
                  ref={uploadRef}
                  multiple
                  autoUpload={false}
                  accept="video/*"
                  showUploadList={{
                    startIcon: false,
                  }}
                  onChange={(files) => {
                    setSourceFileList(files);
                  }}
                >
                  <Space size="large">
                    <Button>选择文件</Button>
                  </Space>
                </Upload>
              </Form.Item>
            ) : (
              <Form.Item field="source" label="待处理文件夹">
                <Input placeholder="输入待处理路径" />
              </Form.Item>
            )
          }
        </FormItem>
        <FormItem field="watermarkType" label="水印类型">
          <Radio.Group
            defaultValue="1"
            options={[
              {
                label: "文字",
                value: "1",
              },
              {
                label: "图片",
                value: "2",
              },
            ]}
          />
        </FormItem>
        <FormItem shouldUpdate noStyle>
          {(values) =>
            values.watermarkType === "1" || !values.watermarkType ? (
              <>
                <Form.Item field="text" label="水印文字">
                  <Input placeholder="请输入水印文字" />
                </Form.Item>
                <FormItem field="textSize" label="文字大小">
                  <InputNumber
                    placeholder="请输入文字水印字号大小"
                    min={0}
                    defaultValue={12}
                  />
                </FormItem>
                <FormItem field="textColor" label="文字颜色">
                  <Input placeholder="请输入文字颜色" defaultValue="#ffffff" />
                </FormItem>
                <FormItem field="strokeSize" label="描边大小">
                  <InputNumber
                    placeholder="请输入文字水印描边大小"
                    min={0}
                    defaultValue={2}
                  />
                </FormItem>
                <FormItem field="strokeColor" label="描边颜色">
                  <Input placeholder="请输入描边颜色" defaultValue="#000000" />
                </FormItem>
                <FormItem field="fontFile" label="字体文件">
                  <Select
                    placeholder="请选择字体文件"
                    onChange={(value) => console.log(form.getFieldsValue())}
                  >
                    {fontList?.map((option) => (
                      <Option key={option.name} value={option.path}>
                        {option.name}
                      </Option>
                    ))}
                  </Select>
                </FormItem>
              </>
            ) : (
              <Form.Item field="source" label="水印图片">
                <Upload
                  ref={uploadRef}
                  multiple
                  autoUpload={false}
                  accept="image/*"
                  showUploadList={{
                    startIcon: false,
                  }}
                  onChange={(files) => {
                    setSourceFileList(files);
                  }}
                >
                  <Space size="large">
                    <Button>选择水印图片</Button>
                  </Space>
                </Upload>
              </Form.Item>
            )
          }
        </FormItem>
        <FormItem wrapperCol={{ offset: 5 }}>
          <Button
            type="primary"
            onClick={async () => {
              try {
                const values = form.getFieldsValue();
                await postWatermarkToVideo(values);
              } catch (e) {
                console.log(e);
              }
            }}
          >
            提交
          </Button>
        </FormItem>
      </Form>
    </div>
  );
});
export default Watermark;
