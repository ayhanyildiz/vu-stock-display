import YahooFinance from 'yahoo-finance2';
import type { StockQuote } from '@shared/models';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function fetchStockQuote(ticker: string): Promise<StockQuote> {
    const quote = await yahooFinance.quote(ticker, {}, { validateResult: false });

    if (!quote || !quote.regularMarketPrice === null) {
        throw new Error(`Invalid stock data for ${ticker}`);
    }

    const currentPrice = quote.regularMarketPrice;
    const previousClose = quote.regularMarketPreviousClose || quote.regularMarketOpen || currentPrice;
    const dollarChange = currentPrice - previousClose;
    const percentChange = previousClose !== 0 ? (dollarChange / previousClose) * 100 : 0;

    return {
        ticker: ticker,
        companyName: quote.shortName || ticker,
        currentPrice,
        previousClose,
        dollarChange,
        percentChange,
    };
}