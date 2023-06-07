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
