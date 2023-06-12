export async function asyncHandler<T>(
  fn: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    throw new Error(`${errorMessage}: ${err.message}`);
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
