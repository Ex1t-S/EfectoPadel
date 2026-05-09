# EfectoPadelApp

Monorepo nuevo para la app movil iOS/Android, panel admin web y API de Efecto Padel.

## Estructura

- `apps/mobile`: Expo React Native para jugadores.
- `apps/admin`: Vite React para el panel del duenio/admin.
- `apps/api`: Express API para auth, reservas, pagos, ranking y torneos.
- `packages/shared`: tipos, constantes y helpers compartidos.
- `docs`: SQL, setup y notas operativas.

## Primer setup

1. Copiar `.env.example` a `.env` en `apps/api`, `apps/mobile` y `apps/admin`.
2. Crear el proyecto Neon y ejecutar `docs/database.sql`.
3. Configurar Google OAuth en Google Cloud.
4. Configurar Mercado Pago sandbox y el webhook `POST /webhooks/mercadopago`.
5. Instalar dependencias desde la raiz:

```bash
npm install
```

## Desarrollo

```bash
npm run dev:api
npm run dev:admin
npm run dev:mobile
```

La reserva solo queda confirmada cuando Mercado Pago informa pago aprobado. Antes de eso, el turno queda bloqueado temporalmente.

## Deploy backend

El backend esta preparado para Railway con `railway.json`. Railway debe construir desde la raiz del monorepo y usar las variables indicadas en `docs/setup.md`.
