import { LiveOptions } from "../scripts/stream";

const FIELD_NAME_MAP = {
  platform: "平台",
  streaming_address: "推流地址",
  streaming_code: "推流密钥",
  video_dir: "视频文件目录",
  watermarkEnabled: "水印开关",
  watermarkImg: "水印图片路径",
  watermarkWidth: "水印图片宽度",
  watermarkPosition: "水印位置",
  transitionType: "转场效果类型",
  simpleTransition: "简单转场效果",
  complexTransition: "复杂转场效果",
};

const SUPPORTED_STREAMING_PROTOCOLS = [
  "rtmp",
  "rtmps",
  "rtmpt",
  "rtmpe",
  "rtmpte",
  "srt",
  "srtt",
];

/**
 * 检查必填参数是否为空
 * @param {Record<string, any>} params - 参数对象
 * @param {string[]} requiredParams - 必填参数列表
 * @returns {string | null} - 如果参数有空值，则返回第一个空参数的名称，否则返回 null
 */
export function checkRequiredParams(
  params: Record<string, any>,
  requiredParams: string[]
): string | null {
  for (const param of requiredParams) {
    if (!params[param] || params[param].trim() === "") {
      // @ts-ignore
      return FIELD_NAME_MAP[param] || param;
    }
  }
  return null;
}

/**
 * 校验推流地址的协议是否支持
 * @param {string} streaming_address - 推流地址
 * @returns {boolean} - 推流地址的协议是否支持
 */
export function isStreamingProtocolSupported(
  streaming_address: string
): boolean {
  const protocol = streaming_address.split(":")[0];
  return SUPPORTED_STREAMING_PROTOCOLS.includes(protocol);
}

/**
 * 校验直播参数是否合法
 * @param {LiveOptions} options - 直播参数对象
 * @returns {string | null} - 如果参数有空值，则返回第一个空参数的名称；如果推流地址的协议不支持，则返回错误信息；否则返回 null
 */
export function validateLiveOptions(options: LiveOptions): string | null {
  const requiredParams = ["streaming_address", "streaming_code"];

  const emptyParam = checkRequiredParams(options, requiredParams);
  if (emptyParam) {
    return `${emptyParam}不能为空`;
  }

  return null;
}
