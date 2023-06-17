import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

class EmailService {
  private static instance: EmailService;

  private transporter: nodemailer.Transporter;

  private readonly configPath: string;

  private constructor() {
    this.configPath = path.resolve(__dirname, "../config/config.json");

    // 检查config.json文件是否存在
    if (!fs.existsSync(this.configPath)) {
      throw new Error("config.json file does not exist.");
    }

    const config = JSON.parse(fs.readFileSync(this.configPath, "utf-8"));

    // 检查是否需要发送邮件
    if (!config.is_email) {
      throw new Error("Email service is turned off in the configuration.");
    }

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

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public static reloadInstance(): EmailService {
    EmailService.instance = new EmailService();
    return EmailService.instance;
  }

  async sendMail(
    to: string,
    subject: string,
    text: string,
    html?: string
  ): Promise<void> {
    const config = JSON.parse(fs.readFileSync(this.configPath, "utf-8"));
    const mailOptions = {
      from: config.form_email_address, // 配置中的发件人邮箱
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

const emailService = EmailService.getInstance();
export { EmailService };
export default emailService;
