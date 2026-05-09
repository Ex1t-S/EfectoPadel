import { config } from "../config.js";

export interface PreferenceInput {
  reservationId: string;
  title: string;
  depositCents: number;
  payerEmail: string;
}

export async function createBookingPreference(input: PreferenceInput) {
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.mercadoPagoAccessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      external_reference: input.reservationId,
      items: [
        {
          title: input.title,
          quantity: 1,
          currency_id: "ARS",
          unit_price: input.depositCents / 100
        }
      ],
      payer: {
        email: input.payerEmail
      },
      back_urls: {
        success: `${config.appPublicUrl}/payment/success`,
        failure: `${config.appPublicUrl}/payment/failure`,
        pending: `${config.appPublicUrl}/payment/pending`
      },
      notification_url: `${config.apiPublicUrl}/webhooks/mercadopago`
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mercado Pago preference failed: ${body}`);
  }

  return response.json() as Promise<{ id: string; init_point: string; sandbox_init_point: string }>;
}

export async function getPayment(paymentId: string) {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${config.mercadoPagoAccessToken}`
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mercado Pago payment lookup failed: ${body}`);
  }

  return response.json() as Promise<{
    id: number;
    status: string;
    external_reference: string | null;
    transaction_amount: number;
  }>;
}
