# Ecommerce Web – Backend (API REST)

Backend robusto y modular para tienda de plantas, diseñado para integrarse con frontend React y soportar pagos reales mediante Stripe (modo test). Provee toda la lógica de negocio, persistencia y servicios críticos para la aplicación.

---

## Descripción general

API RESTful desarrollada en Node.js + TypeScript, conectada a MongoDB Atlas y Cloudinary para gestión de imágenes. Implementa autenticación, catálogo, carrito, pedidos, pagos y administración, con seguridad y validación avanzadas.

---

## Funcionalidades principales

- Catálogo de productos dinámico (CRUD, filtros, paginación)
- Gestión de imágenes en Cloudinary
- Carrito persistente por usuario
- Autenticación JWT (registro, login, roles)
- Creación y gestión de pedidos
- Integración completa con Stripe (pagos, webhooks, estados)
- Endpoints de sistema y salud (`/api/health`, `/api/ready`)
- Administración de contenido y usuarios
- Logging estructurado y manejo global de errores

---

## Pagos

Integración con Stripe en modo test:

- Creación de intents de pago desde backend
- Webhooks para actualización automática de pedidos tras el pago
- Validación de estados: pagado, cancelado, error
- Seguridad en endpoints y validación de firmas Stripe

---

## Arquitectura y módulos

- **Node.js + TypeScript**: base del servidor
- **Express**: framework HTTP
- **MongoDB (Mongoose)**: persistencia de datos
- **Cloudinary**: gestión y optimización de imágenes
- **Stripe**: pagos y webhooks
- **Pino**: logging estructurado
- **Zod**: validación de datos
- **Helmet, CORS**: seguridad

Módulos principales (`src/modules`):

- `products`: catálogo y filtros
- `cart`: carrito de usuario
- `orders`: pedidos y estados
- `payments`: integración Stripe
- `auth`: autenticación y roles
- `content`: contenido dinámico
- `media`: utilidades de imágenes
- `admin`: administración avanzada

---

## Scripts y utilidades

- `npm run dev` – Desarrollo con recarga
- `npm run build` – Compilación a producción
- `npm start` – Arranque en producción
- `npm run lint` – Linting estático
- `npm run typecheck` – Chequeo de tipos
- `npm run test` – Tests de integración
- `npm run seed:products` / `seed:content` / `seed:admin` – Poblar base de datos
- `npm run demo:prepare` – Reset y seed completo para entorno demo
- `npm run smoke:all` – Pruebas rápidas de endpoints críticos
- Scripts para gestión de imágenes IA y Cloudinary

---

## Estructura del proyecto

- `src/` – Código fuente principal
  - `modules/` – Módulos de dominio (productos, carrito, pagos, etc.)
  - `common/`, `middlewares/`, `config/`, `shared/` – Utilidades y configuración
- `scripts/` – Seed, smoke, utilidades de datos y media
- `tests/` – Tests de integración

---

## Seguridad y buenas prácticas

- Variables de entorno validadas y seguras (`.env.example`)
- Helmet y CORS configurados
- JWT para autenticación y roles
- Logging estructurado y trazabilidad
- Manejo global de errores y validaciones estrictas

---

## Despliegue y entorno

Requiere Node.js 20+, MongoDB Atlas y cuenta de Cloudinary. Stripe configurado en modo test.

1. Copia `.env.example` a `.env` y completa las variables
2. Instala dependencias: `npm install`
3. Arranca en desarrollo: `npm run dev`
4. Para producción: `npm run build` y luego `npm start`

---

## Relación con frontend

Este backend está diseñado para ser consumido por el frontend React (ver carpeta `../frontend`). Toda la comunicación se realiza vía API REST y los pagos se gestionan de extremo a extremo, permitiendo un flujo de compra real y seguro.

---

## Estado actual

- API y módulos funcionales y validados
- Pagos Stripe y webhooks activos
- Pruebas de integración y scripts de seed/smoke
- Listo para producción y escalabilidad

---

## Comentarios

Este backend prioriza la robustez, seguridad y escalabilidad, facilitando la evolución del producto y la integración con nuevos servicios o frontends.
