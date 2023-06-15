import { FC } from "react";
import { Button, Form, Input, InputNumber } from "@arco-design/web-react";
import styles from "../../index.module.less";
import { ServerConfig, updateServerConfig } from "../../api/generalApi";
import { axiosInstance } from "../../api/axios";

const FormItem = Form.Item;
const Setting: FC = () => {
  const [form] = Form.useForm();
  return (
    <div className={styles.preMadeWrapper}>
      <Form
        style={{ width: 600 }}
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
        <FormItem wrapperCol={{ offset: 5 }}>
          <Button
            type="primary"
            onClick={async () => {
              try {
                await form.validate();
                const values = form.getFieldsValue() as ServerConfig;
                axiosInstance.updateBaseURL(values.service_address);
                await updateServerConfig(values);
                window.location.reload();
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
};
export default Setting;
