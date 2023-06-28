import { FC, useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Switch,
} from "@arco-design/web-react";
import { observer } from "mobx-react-lite";
import styles from "./index.module.less";
import { ServerConfig, updateServerConfig } from "../../api/generalApi";
import { axiosInstance } from "../../api/axios";
import { useStore } from "../../store";

const FormItem = Form.Item;
const Setting: FC = observer(() => {
  const { streamStore } = useStore();
  const [form] = Form.useForm();
  const [is_email, setIsEmail] = useState<boolean>(false);
  useEffect(() => {
    if (streamStore?.userSettings) {
      form.setFieldsValue(streamStore?.userSettings);
    }
  }, [streamStore?.userSettings]);
  return (
    <div className={styles.preMadeWrapper}>
      <Form
        autoComplete="off"
        form={form}
        validateMessages={{
          required: (_, { label }) =>
            `${label.slice(0, label.length - 1)}不能为空`,
        }}
      >
        <FormItem
          label="服务地址："
          field="service_address"
          rules={[{ required: true }]}
        >
          <Input placeholder="请输入服务地址，例：https://www.backend.com" />
        </FormItem>
        <FormItem
          label="数据库地址："
          field="sql_address"
          rules={[{ required: true }]}
        >
          <Input placeholder="请输入数据库地址，例：128.80.31.12" />
        </FormItem>
        <FormItem label="数据库端口：" field="sql_port">
          <InputNumber placeholder="请输入数据库端口，默认3306" min={0} />
        </FormItem>
        <FormItem
          label="数据库账号："
          field="sql_user"
          rules={[{ required: true }]}
        >
          <Input placeholder="请输入数据库账户" />
        </FormItem>
        <FormItem
          label="数据库密码："
          field="sql_password"
          rules={[{ required: true }]}
        >
          <Input.Password placeholder="请输入数据库密码" />
        </FormItem>
        <FormItem
          label="数据库名称："
          field="sql_database"
          rules={[{ required: true }]}
        >
          <Input placeholder="请输入数据库名称" />
        </FormItem>
        <FormItem
          label="redis地址："
          field="redis_address"
          rules={[{ required: true }]}
        >
          <Input placeholder="请输入redis地址，例：123.249.12.71" />
        </FormItem>
        <FormItem label="redis端口：" field="redis_port">
          <InputNumber placeholder="请输入redis端口，默认6379" min={0} />
        </FormItem>
        <FormItem
          label="邮件通知："
          field="is_email"
          tooltip={<div>建议打开，直播异常时，可通过邮件提醒。</div>}
        >
          <Switch onChange={(e) => setIsEmail(e)} />
        </FormItem>
        {is_email && (
          <>
            <FormItem label="发件服务器地址：" field="email_server_address">
              <Input placeholder="请输入发件服务器地址，例：smtp.exmail.qq.com" />
            </FormItem>
            <FormItem label="发件服务器端口：" field="email_port">
              <InputNumber
                placeholder="请输入发件服务器端口，例：465"
                min={0}
              />
            </FormItem>
            <FormItem label="发件邮箱地址：" field="form_email_address">
              <Input placeholder="请输入邮箱地址，例：xxx.qq.com" />
            </FormItem>
            <FormItem label="发件邮箱密码：" field="form_email_password">
              <Input.Password placeholder="请输入邮箱密码，如使用QQ、Gamil等常用邮箱，需输入对应授权码" />
            </FormItem>
            <FormItem label="收件邮箱地址：" field="to_email_address">
              <Input placeholder="请输入收件邮箱地址" />
            </FormItem>
          </>
        )}
        <FormItem wrapperCol={{ offset: 5 }}>
          <Button
            type="primary"
            onClick={async () => {
              try {
                await form.validate();
                const values = form.getFieldsValue() as ServerConfig;
                axiosInstance.updateBaseURL(values.service_address);
                await updateServerConfig(values);
                // window.location.reload();
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
export default Setting;
