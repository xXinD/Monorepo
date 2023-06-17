import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

class EmailService {
  private static instance: EmailService | null = null;

  private transporter: nodemailer.Transporter;

  private readonly configPath: string;

  private constructor(config: any) {
    this.configPath = path.resolve(process.cwd(), "./config/config.json");

    this.transporter = nodemailer.createTransport({
      host: config.email_server_address,
      port: config.email_port,
      secure: true,
      auth: {
        user: config.form_email_address,
        pass: config.form_email_password,
      },
    });
  }

  public static async getInstance(): Promise<EmailService> {
    if (!EmailService.instance) {
      const configFilePath = path.resolve(
        process.cwd(),
        "./config/config.json"
      );
      // 检查config.json文件是否存在
      if (!fs.existsSync(configFilePath)) {
        throw new Error("config.json file does not exist.");
      }
      const config = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));

      // 检查是否需要发送邮件
      if (!config.is_email) {
        throw new Error("Email service is turned off in the configuration.");
      }

      EmailService.instance = new EmailService(config);
    }
    return EmailService.instance;
  }

  public static async reloadInstance(): Promise<EmailService> {
    EmailService.instance = null;
    return await EmailService.getInstance();
  }

  async sendMail(
    to: string,
    subject: string,
    text: string,
    html?: string
  ): Promise<void> {
    const config = JSON.parse(fs.readFileSync(this.configPath, "utf-8"));
    const mailOptions = {
      from: config.form_email_address,
      to,
      subject,
      text,
      html,
    };

    await this.transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log(`Email sent: ${info.response}`);
      }
    });
  }
}

export { EmailService };
