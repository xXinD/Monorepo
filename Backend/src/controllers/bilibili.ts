import { FetchClass } from "../api/fetchInstance";
import { getUrlParams } from "../utils/stringUtils";
import redisClient from "../utils/redisClient";
import { asyncHandler } from "../utils/handler";

class BilibiliService {
  private fetchInstance: any;

  private fetchLiveInstance: any;

  private fetchRoomInstance: any;

  constructor() {
    this.fetchInstance = new FetchClass("https://passport.bilibili.com");
    this.fetchLiveInstance = new FetchClass(
      "https://api.live.bilibili.com/xlive/app-blink"
    );
    this.fetchRoomInstance = new FetchClass(
      "https://api.live.bilibili.com/room"
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

  // 查询二维码扫码状态
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

  // 获取推流地址
  getStreamAddr = async (ctx: any): Promise<void> => {
    await asyncHandler(async () => {
      const { id } = ctx.params;
      const { loginCookie, bili_jct } = JSON.parse(
        await redisClient.get(`login_data_${id}`)
      );
      ctx.body = await this.fetchLiveInstance.post(
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
    }, "获取推流地址出错：");
  };

  // 获取分区列表
  getAreaList = async (ctx: any): Promise<void> => {
    await asyncHandler(async () => {
      ctx.body = await this.fetchRoomInstance.get("/v1/Area/getList");
    }, "获取分区列表出错：");
  };

  // 获取房间号
  getRoomId = async (ctx: any): Promise<void> => {
    const { id } = ctx.params;
    const { loginCookie } = JSON.parse(
      await redisClient.get(`login_data_${id}`)
    );
    await asyncHandler(async () => {
      ctx.body = await this.fetchLiveInstance.get(
        "/v1/streamingRelay/relayInfo",
        {},
        "",
        {
          cookie: loginCookie,
        }
      );
    }, "获取分区列表出错：");
  };
}
export const bilibiliService = new BilibiliService();
