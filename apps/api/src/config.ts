import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 4000),
  appPublicUrl: required("APP_PUBLIC_URL"),
  adminPublicUrl: required("ADMIN_PUBLIC_URL"),
  apiPublicUrl: required("API_PUBLIC_URL"),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  mercadoPagoAccessToken: required("MERCADOPAGO_ACCESS_TOKEN"),
  mercadoPagoWebhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET ?? ""
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name}`);
  return value;
}
