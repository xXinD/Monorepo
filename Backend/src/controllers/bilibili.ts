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
      ctx.body = { message: "调用Bilibili【申请二维码】出错：", error };
    }
  };

  /**
   * 查询二维码扫描状态
   *
   * @async
   * @param {string} id 二维码ID。
   * @returns {Object} Result returned by json.
   * @throws {Error} Error thrown by json.
   */

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
      ctx.body = { message: "调用Bilibili【查询二维码扫描状态】出错：", error };
    }
  };

  /**
   * 获取推流地址
   *
   * @async
   * @param {string} ctx.params.id 二维码ID。
   * @returns {Object} Result returned by json.
   * @throws {Error} Error thrown by json.
   * @param ctx
   */
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

  /**
   * 获取分区列表
   *
   * @async
   * @returns {Object} Result returned by json.
   * @throws {Error} Error thrown by json.
   * @param ctx
   */
  getAreaList = async (ctx: any): Promise<void> => {
    await asyncHandler(async () => {
      ctx.body = await this.fetchRoomInstance.get("/v1/Area/getList");
    }, "调用Bilibili【获取分区列表】出错：");
  };

  /**
   * 获取房间ID
   *
   * @async
   * @returns {Object} Result returned by json.
   * @throws {Error} Error thrown by json.
   * @param id
   */
  queryRoomId = async (id: string): Promise<any> => {
    const { loginCookie } = JSON.parse(
      await redisClient.get(`login_data_${id}`)
    );
    return await asyncHandler(
      async () =>
        await this.fetchLiveInstance.get(
          "/v1/streamingRelay/relayInfo",
          {},
          "",
          {
            cookie: loginCookie,
          }
        ),
      "调用Bilibili【获取分区列表】出错："
    );
  };

  getRoomId = async (ctx: any): Promise<void> => {
    const { id } = ctx.params;
    await asyncHandler(async () => {
      ctx.body = await this.queryRoomId(id);
    }, "调用Bilibili【获取分区列表】出错：");
  };

  /**
   * 修改直播间标题
   *
   * @async
   * @param {string} ctx.params.id 二维码ID。
   * @param {string} ctx.request.body.room_name 直播间标题。
   * @returns {Object} Result returned by json.
   * @throws {Error} Error thrown by json.
   * @param ctx
   */
  updateRoomTitle = async (ctx: any): Promise<void> => {
    const { id } = ctx.params;
    const { room_name } = ctx.request.body;
    const { bili_jct, loginCookie } = JSON.parse(
      await redisClient.get(`login_data_${id}`)
    );
    await asyncHandler(async () => {
      const {
        data: { room_id },
      } = await this.fetchLiveInstance.get(
        "/v1/streamingRelay/relayInfo",
        {},
        "",
        {
          cookie: loginCookie,
        }
      );
      ctx.body = await this.fetchRoomInstance.post(
        "/v1/Room/update",
        {
          room_id,
          title: room_name,
          csrf: bili_jct,
        },
        "urlencoded",
        "json",
        {
          cookie: loginCookie,
        }
      );
    }, "调用Bilibili【更新房间标题】出错：");
  };

  /**
   * 开始直播
   *
   * @async
   * @param {string} ctx.params.id 二维码ID。
   * @param {string} ctx.request.body.area_v2 直播分区最子级ID。
   * @returns {Object} Result returned by json.
   * @throws {Error} Error thrown by json.
   * @param ctx
   */
  startLive = async ({
    id,
    area_v2,
  }: {
    id: string;
    area_v2: string;
  }): Promise<any> => {
    const { bili_jct, loginCookie } = JSON.parse(
      await redisClient.get(`login_data_${id}`)
    );
    return await asyncHandler(async () => {
      const {
        data: { room_id },
      } = await this.queryRoomId(id);
      return await this.fetchRoomInstance.post(
        "/v1/Room/startLive",
        {
          room_id,
          area_v2,
          platform: "pc",
          csrf: bili_jct,
        },
        "urlencoded",
        "json",
        {
          cookie: loginCookie,
        }
      );
    }, "调用Bilibili【开始直播】出错：");
  };

  postStartLive = async (ctx: any): Promise<void> => {
    const { id } = ctx.params;
    const { area_v2 } = ctx.request.body;
    await asyncHandler(async () => {
      ctx.body = await this.startLive({ id, area_v2 });
    }, "调用Bilibili【开始直播】出错：");
  };

  /**
   * 关闭直播
   *
   * @async
   * @param {string} ctx.params.id 二维码ID。
   * @returns {Object} Result returned by json.
   * @throws {Error} Error thrown by json.
   * @param ctx
   */
  postStopLive = async (ctx: any): Promise<void> => {
    const { id } = ctx.params;
    const { bili_jct, loginCookie } = JSON.parse(
      await redisClient.get(`login_data_${id}`)
    );
    await asyncHandler(async () => {
      const {
        data: { room_id },
      } = await this.fetchLiveInstance.get(
        "/v1/streamingRelay/relayInfo",
        {},
        "",
        {
          cookie: loginCookie,
        }
      );
      ctx.body = await this.fetchRoomInstance.post(
        "/v1/Room/stopLive",
        {
          room_id,
          csrf: bili_jct,
        },
        "urlencoded",
        "json",
        {
          cookie: loginCookie,
        }
      );
    }, "调用Bilibili【关闭直播】出错：");
  };

  /**
   * 获取直播间信息
   *
   * @async
   * @param {string} ctx.params.id 二维码ID。
   * @returns {Object} Result returned by json.
   * @throws {Error} Error thrown by json.
   * @param ctx
   */
  getRoomInfo = async (ctx: any): Promise<void> => {
    const { id } = ctx.params;
    const { loginCookie } = JSON.parse(
      await redisClient.get(`login_data_${id}`)
    );
    await asyncHandler(async () => {
      const {
        data: { room_id },
      } = await this.fetchLiveInstance.get(
        "/v1/streamingRelay/relayInfo",
        {},
        "",
        {
          cookie: loginCookie,
        }
      );
      ctx.body = await this.fetchRoomInstance.get(
        `/v1/Room/get_info?room_id=${room_id}`,
        {},
        "urlencoded",
        "json",
        {
          cookie: loginCookie,
        }
      );
    }, "调用Bilibili【获取直播间信息】出错：");
  };

  /**
   * 获取直播间状态
   *
   * @async
   * @returns {Object} Result returned by json.
   * @throws {Error} Error thrown by json.
   * @param id
   */
  roomStatusInfo = async (id: string): Promise<any> => {
    const { loginCookie } = JSON.parse(
      await redisClient.get(`login_data_${id}`)
    );
    return await asyncHandler(async () => {
      const {
        data: { room_id },
      } = await this.fetchLiveInstance.get(
        "/v1/streamingRelay/relayInfo",
        {},
        "",
        {
          cookie: loginCookie,
        }
      );
      const {
        data: { uid },
      } = await this.fetchRoomInstance.get(
        `/v1/Room/get_info?room_id=${room_id}`,
        {},
        "urlencoded",
        "json",
        {
          cookie: loginCookie,
        }
      );
      const { data: result, code } = await this.fetchRoomInstance.get(
        `/v1/Room/get_status_info_by_uids?uids[]=${uid}`,
        {},
        "urlencoded",
        "json",
        {
          cookie: loginCookie,
        }
      );
      let results: any;
      if (!code) {
        results = result[uid];
      } else {
        results = result;
      }
      return results;
    }, "调用Bilibili【获取直播间信息】出错：");
  };

  getRoomStatusInfo = async (ctx: any): Promise<void> => {
    const { id } = ctx.params;
    await asyncHandler(async () => {
      ctx.body = await this.roomStatusInfo(id);
    }, "调用Bilibili【获取直播间信息】出错：");
  };

  /**
   * 查询封禁信息
   *
   * @async
   * @param {string} ctx.params.id 二维码ID。
   * @returns {Object} Result returned by json.
   * @throws {Error} Error thrown by json.
   * @param ctx
   */
  getBannedInfoById = async (id: string): Promise<any> =>
    await asyncHandler(async () => {
      const { loginCookie } = JSON.parse(
        await redisClient.get(`login_data_${id}`)
      );
      const {
        data: { room_id },
      } = await this.fetchLiveInstance.get(
        "/v1/streamingRelay/relayInfo",
        {},
        "",
        {
          cookie: loginCookie,
        }
      );
      return await this.fetchRoomInstance.get(
        `/v1/Room/getBannedInfo?roomid=${room_id}`,
        {},
        "urlencoded",
        "json",
        {
          cookie: loginCookie,
        }
      );
    }, "调用Bilibili【查询封禁信息】出错：");

  getBannedInfo = async (ctx: any): Promise<void> => {
    await asyncHandler(async () => {
      const { id } = ctx.params;
      ctx.body = await this.getBannedInfoById(id);
    }, "调用Bilibili【查询封禁信息】出错：");
  };
}
export const bilibiliService = new BilibiliService();
