// lib/logger-client.ts
// Logger para client-side que envia logs via API Route

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

async function sendLog(level: LogLevel, message: string, meta?: any) {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, meta }),
    });
  } catch (error) {
    // Fallback para console se API falhar
    console[level](`[Logger] ${message}`, meta);
  }
}

const logger = {
  info: (msg: string, meta?: any) => sendLog('info', msg, meta),
  warn: (msg: string, meta?: any) => sendLog('warn', msg, meta),
  error: (msg: string, meta?: any) => sendLog('error', msg, meta),
  debug: (msg: string, meta?: any) => sendLog('debug', msg, meta),
};

export default logger;
