import type { AppConfig, StockQuote } from '@shared/models';

export async function fetchStockQuoteFinnhub(
    ticker: string,
    config: AppConfig
): Promise<StockQuote> {
    if (!config.finnhubToken) {
        throw new Error('Finnhub token not configured');
    }

    const symbol = ticker.trim().toUpperCase();

    const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${config.finnhubToken}`
    );

    if (!res.ok) {
        throw new Error(`Finnhub error ${res.status} for ${symbol}`);
    }

    const q = await res.json();

    if (!q || q.c === 0 || q.pc === 0) {
        throw new Error(`Invalid stock data for ${symbol}`);
    }

    const currentPrice = q.c;
    const previousClose = q.pc;
    const dollarChange = currentPrice - previousClose;
    const percentChange =
        previousClose !== 0 ? (dollarChange / previousClose) * 100 : 0;

    return {
        ticker: symbol,
        companyName: symbol,
        currentPrice,
        previousClose,
        dollarChange,
        percentChange,
    };
}
