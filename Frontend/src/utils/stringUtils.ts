/**
 * @author XinD
 * @date 2023/6/22
 * @description 判断字符串是否为http或https开头
 */
export const isHttp = (str: string): boolean =>
  str.startsWith("http://") || str.startsWith("https://");
