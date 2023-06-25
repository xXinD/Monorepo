import { FetchClass } from "../api/fetchInstance";
import { getUrlParams } from "../utils/stringUtils";
import redisClient from "../utils/redisClient";

class BilibiliService {
  private fetchInstance: any;

  private fetchLiveInstance: any;

  constructor() {
    this.fetchInstance = new FetchClass("https://passport.bilibili.com");
    this.fetchLiveInstance = new FetchClass(
      "https://api.live.bilibili.com/xlive/app-blink"
    );
  }

  /**
   * 申请二维码
   *
   * @async
   * @returns {Object} Result returned by json.
   */
  getTheLoginQRCode = async (ctx: any): Promise<void> => {
    try {
      ctx.body = await this.fetchInstance.get(
        "/x/passport-login/web/qrcode/generate"
      );
    } catch (error) {
      console.error(error);
      ctx.status = 500;
      ctx.body = { message: "申请二维码失败：", error };
    }
  };

  getTheLoginPoll = async (ctx: any): Promise<void> => {
    const { id } = ctx.params;
    try {
      const { data } = await this.fetchInstance.get(
        `/x/passport-login/web/qrcode/poll?qrcode_key=${id}`
      );
      if (data.code === 0) {
        const { bili_jct, SESSDATA } = getUrlParams(data.url);
        const loginVerifyData = {
          bili_jct,
          SESSDATA,
          loginCookie: `bili_jct=${bili_jct};SESSDATA=${SESSDATA}`,
        };
        await redisClient.set(
          `login_data_${id}`,
          JSON.stringify(loginVerifyData)
        );
      }
      ctx.body = data;
    } catch (error) {
      console.error(error);
      ctx.status = 500;
      ctx.body = { message: "扫码登录失败：", error };
    }
  };

  getStreamAddr = async (ctx: any): Promise<void> => {
    const { id } = ctx.params;
    const { loginCookie, bili_jct } = JSON.parse(
      await redisClient.get(`login_data_${id}`)
    );
    console.log(loginCookie, bili_jct, 11111);
    const data = await this.fetchLiveInstance.post(
      "/v1/live/FetchWebUpStreamAddr",
      {
        platform: "pc",
        backup_stream: 0,
        csrf_token: bili_jct,
        csrf: bili_jct,
      },
      "urlencoded",
      "json",
      {
        cookie: loginCookie,
      }
    );
    ctx.body = data;
  };
}
export const bilibiliService = new BilibiliService();
