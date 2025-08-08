import * as crypto from "crypto";

function calculateSignature(timestamp, body) {
  let message = "e8zi4Sv5nM" + timestamp;

  if (body) {
    message += body;
  }

  const hmac = crypto.createHmac("sha256", "rPDzM4te3Wb4JrUpx6ZV7dtueWGXp4918");
  hmac.update(message, "utf-8");
  const signature = hmac.digest("hex");

  return `V2-HMAC-SHA256, Signature: ${signature}`;
}

// Example usage
const timestamp = new Date().toISOString(); // Set timestamp to current time
const body =
  '{"amount":5000,"currency":"COP","country":"CO","payment_method_id":"PC","payment_method_flow":"REDIRECT","payer":{"name":"Jane Doe","email":"jane@example.com","document":"12345678","address":{"country":"CO","state":"Antioquia","city":"Medellin","zip_code":"8858","street":"Av. Principal","number":"5940"}},"order_id":"order_1754661398555","description":"Pago con PSE","notification_url":"https://webhook.site/444339bb-f6fe-43e4-b68f-d15f0616e558","callback_url":"https://tu-sitio.com/success_page"}';
const result = calculateSignature(timestamp, body);
console.log(result);
