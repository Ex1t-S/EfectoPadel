# Setup con Neon PostgreSQL

## Neon

1. Crear un proyecto en Neon.
2. Copiar el connection string pooled o direct, con `sslmode=require`.
3. Ejecutar `docs/database.sql` desde Neon SQL Editor.
4. Pegar el connection string en `apps/api/.env` como `DATABASE_URL`.

## API

Crear `apps/api/.env` desde `.env.example`:

```env
PORT=4000
APP_PUBLIC_URL=http://localhost:8081
ADMIN_PUBLIC_URL=http://localhost:5173
API_PUBLIC_URL=http://localhost:4000
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
JWT_SECRET=un-secreto-largo
GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com
MERCADOPAGO_ACCESS_TOKEN=TEST-tu-token
MERCADOPAGO_WEBHOOK_SECRET=change-me
```

## Primer admin

1. Registrarse desde la app o crear un usuario por API.
2. Promoverlo en Neon:

```sql
update profiles set role = 'owner' where email = 'admin@efectopadel.com';
```

## Google OAuth

1. Crear credenciales OAuth en Google Cloud.
2. Usar el mismo Client ID en `GOOGLE_CLIENT_ID` y `EXPO_PUBLIC_GOOGLE_CLIENT_ID`.
3. La app movil obtiene el `id_token`; la API lo valida y crea/actualiza el usuario en Neon.

## Mercado Pago

1. Usar credenciales sandbox para desarrollo.
2. Configurar webhook hacia `https://TU_API_PUBLICA/webhooks/mercadopago`.
3. Evento necesario: payments.

## Deploy backend en Railway

1. Subir este repo a GitHub.
2. Crear un proyecto en Railway y conectar el repo.
3. Usar la raiz del repo como root del servicio; `railway.json` ya indica que solo se compila y arranca la API.
4. Configurar estas variables en Railway:

```env
NODE_ENV=production
APP_PUBLIC_URL=https://tu-app-mobile-o-web
ADMIN_PUBLIC_URL=https://tu-admin.vercel.app
API_PUBLIC_URL=https://tu-api.up.railway.app
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
JWT_SECRET=un-secreto-largo
GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com
MERCADOPAGO_ACCESS_TOKEN=TEST-o-PROD-token
MERCADOPAGO_WEBHOOK_SECRET=change-me
```

5. Cuando Railway genere la URL publica, actualizar `API_PUBLIC_URL` con esa URL.
6. En Mercado Pago, configurar el webhook a `https://tu-api.up.railway.app/webhooks/mercadopago`.
7. En mobile/admin, usar esa URL como `EXPO_PUBLIC_API_URL` y `VITE_API_URL`.

## Probar localmente

```bash
npm install
npm run dev:api
npm run dev:admin
npm run dev:mobile
```

Para probar Mercado Pago webhooks localmente necesitas exponer la API con ngrok/cloudflared y poner esa URL en `API_PUBLIC_URL`.
