// app/api/log/route.ts
// API Route para enviar logs ao BetterStack (server-side only)

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger-winston';

export async function POST(request: NextRequest) {
  try {
    const { level, message, meta } = await request.json();

    // DEBUG: Verificar se token está configurado
    console.log('🔍 LOGTAIL_TOKEN:', process.env.LOGTAIL_TOKEN ? 'Configurado ✅' : 'FALTANDO ❌');

    // Valida level
    if (!['info', 'warn', 'error', 'debug'].includes(level)) {
      return NextResponse.json({ error: 'Invalid log level' }, { status: 400 });
    }

    // Envia log para BetterStack via winston
    logger[level as 'info' | 'warn' | 'error' | 'debug'](message, meta);
    console.log(`✅ Log enviado: [${level}] ${message}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao processar log:', error);
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}
