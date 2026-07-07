export interface AppConfig {
    vuServer: {
        url: string;
        apiKey: string
    };
    settings: {
        intervalMinutes: number;
        thresholdPercent: number
    };
    logoDevToken: string;
    finnhubToken?: string;
    dials?: Record<string, Dial>;
}

export interface Dial {
    ticker?: string;
}

export interface StockQuote {
    ticker: string;
    companyName: string;
    currentPrice: number;
    previousClose: number;
    dollarChange: number;
    percentChange: number;
}

export interface DialState {
    lastPrice: number;
    lastCrc: number | null;
}
