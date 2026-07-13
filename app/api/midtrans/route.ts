import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { external_id, amount, description, items, customer, success_redirect_url } = body;

    const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;

    if (!XENDIT_SECRET_KEY) {
      throw new Error("XENDIT_SECRET_KEY is not configured in environment variables.");
    }

    const authHeader = 'Basic ' + Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

    const response = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id,
        amount,
        description,
        currency: 'IDR',
        items,
        customer,
        success_redirect_url: success_redirect_url || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || JSON.stringify(data));
    }

    return NextResponse.json({ 
      invoice_url: data.invoice_url, 
      invoice_id: data.id,
      status: data.status,
    });

  } catch (error: any) {
    console.error("Xendit API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create invoice" }, 
      { status: 500 }
    );
  }
}
