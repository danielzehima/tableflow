const API_URL = "https://pay.genius.ci/api/v1/merchant";

function authHeaders(apiKey?: string | null, apiSecret?: string | null) {
  return {
    "Content-Type": "application/json",
    "X-API-Key": apiKey || process.env.GENIUSPAY_API_KEY || "",
    "X-API-Secret": apiSecret || process.env.GENIUSPAY_API_SECRET || "",
  };
}

type InitPaymentParams = {
  amount: number;
  description?: string;
  returnUrl: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, string>;
  apiKey?: string | null;
  apiSecret?: string | null;
};

type InitPaymentResult = {
  success: boolean;
  data?: { reference: string; checkout_url: string; status: string };
  message?: string;
};

type GetPaymentResult = {
  success: boolean;
  data?: { reference: string; amount: number; status: string };
};

export async function initGeniusPayPayment(params: InitPaymentParams): Promise<InitPaymentResult> {
  const res = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: authHeaders(params.apiKey, params.apiSecret),
    body: JSON.stringify({
      amount: params.amount,
      currency: "XOF",
      description: params.description ?? "Paiement TableFlow",
      return_url: params.returnUrl,
      customer: {
        name: params.customerName ?? "Client",
        email: params.customerEmail ?? "client@tableflow.app",
        phone: params.customerPhone ?? "",
      },
      metadata: params.metadata ?? {},
    }),
  });
  return res.json();
}

export async function getGeniusPayPayment(reference: string): Promise<GetPaymentResult> {
  const res = await fetch(`${API_URL}/payments/${reference}`, {
    headers: authHeaders(),
  });
  return res.json();
}
