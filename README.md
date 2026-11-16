# EfectoPadel

Aplicación para gestionar un club de pádel: experiencia móvil para jugadores, panel web de administración y API para reservas, pagos, ranking y torneos.

[Configuración](docs/setup.md) · [Desarrollo](#desarrollo-local) · [Arquitectura](#arquitectura) · [Base de datos](docs/database.sql)

## Alcance

- App móvil para iOS y Android con Expo y React Native.
- Panel administrativo con React y Vite.
- API Express con autenticación, reservas y pagos.
- Integración con Google OAuth y Mercado Pago.
- Tipos, constantes y utilidades compartidos entre aplicaciones.

**Flujo de reserva:** el turno se bloquea temporalmente y solo queda confirmado cuando Mercado Pago informa un pago aprobado. Usar credenciales sandbox durante el desarrollo.

## Tecnologías

| Capa | Tecnología |
| --- | --- |
| Lenguaje | TypeScript |
| Móvil | Expo y React Native |
| Administración | React y Vite |
| API | Node.js y Express |
| Datos | PostgreSQL, con configuración documentada para Neon |
| Integraciones | Google OAuth y Mercado Pago |
| Organización | Monorepo con npm workspaces |

## Arquitectura

| Ruta | Responsabilidad |
| --- | --- |
| [`apps/mobile`](apps/mobile) | Aplicación para jugadores |
| [`apps/admin`](apps/admin) | Panel para el dueño y administradores |
| [`apps/api`](apps/api) | Autenticación y lógica de reservas, pagos, ranking y torneos |
| [`packages/shared`](packages/shared) | Tipos, constantes y helpers compartidos |
| [`docs`](docs) | SQL y guías de configuración |

## Configuración inicial

```bash
git clone https://github.com/Ex1t-S/EfectoPadel.git
cd EfectoPadel
npm install
```

1. Copiar `.env.example` a `.env` en `apps/api`, `apps/mobile` y `apps/admin`.
2. Crear una base PostgreSQL de desarrollo y ejecutar [`docs/database.sql`](docs/database.sql).
3. Configurar Google OAuth y Mercado Pago sandbox según [`docs/setup.md`](docs/setup.md).
4. Configurar el webhook `POST /webhooks/mercadopago` y las URLs de API utilizadas por las aplicaciones.

## Desarrollo local

Ejecutar cada servicio en una terminal independiente:

```bash
npm run dev:api
npm run dev:admin
npm run dev:mobile
```

Para probar la app móvil en el navegador:

```bash
npm run dev:mobile:web
```

La guía local utiliza `http://localhost:8080/login` para ese modo web.

## Comprobaciones disponibles

```bash
npm run typecheck
npm run build:api
```

Estos comandos están definidos en `package.json`; su presencia no implica que las integraciones externas hayan sido verificadas en este entorno.

## Despliegue

La API incluye configuración para Railway en [`railway.json`](railway.json). El servicio debe construir desde la raíz del monorepo y utilizar las variables indicadas en [la guía de configuración](docs/setup.md). Mobile y admin deben apuntar a la URL pública de la API.
