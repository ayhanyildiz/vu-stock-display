import type { NextFunction, Request, Response } from 'express';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
    const statusCode = err?.status || err?.statusCode || 500;
    const message = typeof err === 'string' ? err : (err?.message || 'Internal Server Error');

    console.error(`❌ [${statusCode}] Server Error:`, message);

    res.status(statusCode).json({
        error: message
    });
}