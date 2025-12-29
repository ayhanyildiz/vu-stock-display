import * as sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { StockQuote } from '@shared/models';
import { PATHS } from '../config/paths.ts';


export async function getLogoBuffer(ticker: string, token: string): Promise<Buffer> {
    const filePath = path.join(PATHS.LOGO_CACHE_DIR, `${ticker}.png`);

    try {
        await fs.mkdir(PATHS.LOGO_CACHE_DIR, { recursive: true });
    } catch {
    }

    try {
        return await fs.readFile(filePath);
    } catch {
        const logoUrl = `https://img.logo.dev/ticker/${ticker}?token=${token}&size=80&format=png`;
        const response = await fetch(logoUrl);
        if (!response.ok) throw new Error(`Logo fetch failed: ${response.status}`);

        const buffer = Buffer.from(await response.arrayBuffer());
        await fs.writeFile(filePath, buffer as any);
        return buffer;
    }
}

function createSvgOverlay(quote: StockQuote): string {
    const sign = quote.dollarChange >= 0 ? '▲' : '▼';
    const absDollar = Math.abs(quote.dollarChange).toFixed(2);
    const absPercent = Math.abs(quote.percentChange).toFixed(2);
    const changeText = `${sign} [$${absDollar}] - [${absPercent}%]`;
    const cleanName = quote.companyName.length > 18
        ? quote.companyName.substring(0, 15) + '...'
        : quote.companyName;

    return `
            <svg width="200" height="144" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="92" width="200" height="52" fill="#fff"/>
              <style>
                .name {
                  fill: #131313;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  font-size: 16px;
                  font-weight: 600;
                }
                .change {
                  fill: #000000;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  font-size: 18px;
                  font-weight: 700;
                }
              </style>
              <text x="50%" y="108" text-anchor="middle" class="name">${cleanName} (${quote.ticker})</text>
              <text x="50%" y="134" text-anchor="middle" class="change">${changeText}</text>
            </svg>
            `;
}

export async function generateDialImage(quote: StockQuote, logoDevToken: string): Promise<Buffer> {
    const logoBuffer = await getLogoBuffer(quote.ticker, logoDevToken);
    const textBg = ` <svg width="200" height="144">
                      <rect x="0" y="92" width="200" height="52" fill="white"/>
                    </svg>`;
    const svgOverlay = createSvgOverlay(quote);
    const normalized = await sharp.default({
        create: { width: 200, height: 144, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
    })
        .composite([
            { input: logoBuffer, top: 8, left: 60 },
            { input: Buffer.from(svgOverlay), top: 0, left: 0 },
        ])
        .normalise({ lower: 10, upper: 95 })
        .png()
        .toBuffer();

    return sharp.default(normalized)
        .composite([
            { input: Buffer.from(textBg), top: 0, left: 0 },
            { input: Buffer.from(svgOverlay), top: 0, left: 0 },
        ])
        .png()
        .toBuffer();
}