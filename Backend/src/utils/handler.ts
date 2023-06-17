import Koa from "koa";
import { globalErrorHandler } from "../middleware/error";

export async function asyncHandler<T>(
  fn: () => Promise<T>,
  errorMessage: string,
  ctx?: Koa.Context // 可选的Koa上下文，只有在处理HTTP请求时才提供
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (ctx) {
      // 在HTTP请求上下文中，使用你的 errorHandler 中间件处理错误
      ctx.app.emit("error", err, ctx);
    } else {
      // 在非HTTP上下文中，使用 globalErrorHandler 处理错误
      globalErrorHandler(errorMessage, err);
    }
    throw err; // 在这里，我们继续抛出错误，让其他中间件或调用者可以处理它
  }
}

export async function throttle(fn: (...args: any[]) => void, wait: number) {
  // eslint-disable-next-line no-undef
  let timer: NodeJS.Timeout | null = null;
  let previous = 0;

  return function (...args: any[]) {
    const now = Date.now();
    const remaining = wait - (now - previous);
    if (remaining <= 0 || remaining > wait) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      previous = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        previous = Date.now();
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}
