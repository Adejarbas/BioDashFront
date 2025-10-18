import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.SECRET_STRIPE_KEY || 'sk_test_51RyHV1GskFwcCjBHKHrjtCMX3BXKH2EYmqdxIQk5pttNVQEhoD4Mf0daZXAWY2Qelo22MA52oY0PivzkU2EwYESw00Qjs2gux4', {
  apiVersion: '2025-07-30.basil',
});

export async function POST(req: NextRequest) {
  // Autenticação via Supabase usando cookies (App Router)
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // (Opcional) Receber dados do produto via body
  // const { productName, amount } = await req.json();

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'BRL',
            product_data: {
              name: 'Valor pagamento', // Troque conforme necessário
            },
            unit_amount: 2000, // Troque conforme necessário
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000',
      cancel_url: 'http://localhost:3000',
      customer_email: user.email,
    });
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}