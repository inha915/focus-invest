export class MarketDataError extends Error {
  constructor(
    message: string,
    readonly status: number = 502,
    readonly code?: string,
  ) {
    super(message);
    this.name = "MarketDataError";
  }
}
