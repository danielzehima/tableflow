const API_URL = "https://api-checkout.cinetpay.com/v2";

type InitPaymentParams = {
  transactionId: string;
  amount: number;
  description: string;
  returnUrl: string;
  notifyUrl: string;
  cancelUrl?: string;
  customerName: string;
  customerSurname: string;
  customerEmail?: string;
  customerPhone?: string;
};

type InitPaymentResult = {
  code: string;
  message: string;
  data?: { payment_token: string; payment_url: string };
};

type VerifyPaymentResult = {
  code: string;
  data?: { status: string; amount: number; currency: string };
};

export async function initCinetPayPayment(params: InitPaymentParams): Promise<InitPaymentResult> {
  const res = await fetch(`${API_URL}/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: params.transactionId,
      amount: params.amount,
      currency: "XOF",
      description: params.description,
      return_url: params.returnUrl,
      notify_url: params.notifyUrl,
      cancel_url: params.cancelUrl ?? params.returnUrl,
      customer_name: params.customerName,
      customer_surname: params.customerSurname,
      customer_email: params.customerEmail ?? "client@tableflow.app",
      customer_phone_number: params.customerPhone ?? "",
      customer_address: "Abidjan",
      customer_city: "Abidjan",
      customer_country: "CI",
      customer_state: "CI",
      customer_zip_code: "00000",
      channels: "ALL",
    }),
  });
  return res.json();
}

export async function verifyCinetPayPayment(transactionId: string): Promise<VerifyPaymentResult> {
  const res = await fetch(`${API_URL}/payment/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId,
    }),
  });
  return res.json();
}
