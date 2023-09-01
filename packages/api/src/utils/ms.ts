export type ReadableTime =
  | `${number}ms`
  | `${number}s`
  | `${number}m`
  | `${number}h`
  | `${number}d`
  | string;

export function readableTimeToMilliseconds(readable: ReadableTime) {
  const match = readable.match(/^(\d+)(ms|s|m|h|d)$/);
  if (!match) {
    throw new Error(`Invalid time: ${readable}`);
  }
  const [value, unit] = match.slice(1);
  let multiplier = 1 / 1000;
  switch (unit) {
    case 's':
      multiplier = 1;
      break;
    case 'm':
      multiplier = 60;
      break;
    case 'h':
      multiplier = 60 * 60;
      break;
    case 'd':
      multiplier = 60 * 60 * 24;
      break;
    default:
      multiplier = 1 / 1000;
      break;
  }
  return Number(value) * multiplier * 1000;
}

export function futureUtcMilliseconds(readable: ReadableTime) {
  return Date.now() + readableTimeToMilliseconds(readable);
}
