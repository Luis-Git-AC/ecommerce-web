# Roadmap Backend (Sprint Plan)

Plan de ejecución

## Contexto rápido

- Frontend base ya está avanzado
- MongoDB Atlas y Cloudinary ya están elegidos
- Objetivo: pasar de mocks a backend real, con imágenes, contenido, auth, carrito y pagos en modo test

---

## Sprint 0 - Fundación técnica (completado)

- API en Node + TypeScript
- Conexión a MongoDB Atlas
- Configuración de entorno (.env + validación)
- Logging y manejo de errores global
- Endpoints de sistema (`/api/health`, `/api/ready`)
- Base de Cloudinary conectada por configuración

Estado:

- Completado.

---

## Sprint 1 - Catálogo real (productos)

Objetivo:

- Quitar dependencia de mocks para tienda y detalle de producto.

- Modelo `Product` en MongoDB.
- Endpoints:
  - `GET /api/products`
  - `GET /api/products/:id`
  - `GET /api/products/featured`
  - `GET /api/products/related/:id`
- Filtros (tipo, cuidado, luz, tamaño, pet-friendly).
- Orden (destacadas, precio asc, precio desc).
- Paginación (`page`, `limit`, `total`).
- Índices para consultas frecuentes.

Resultado esperado:

- Shop y ProductPage consumen backend real.

---

## Sprint 2 - Imágenes productivas (Cloudinary)

Objetivo:

- Dejar de servir assets locales desde frontend y centralizar imágenes correctamente.

- Script de subida masiva a Cloudinary desde carpeta local.
- Estructura de carpetas y nombres consistente por producto.
- Guardado en Mongo de `secure_url` y `public_id`.
- URLs optimizadas para uso real (`f_auto`, `q_auto`, tamaños por contexto).
- Endpoint de productos devolviendo imágenes optimizadas.

Resultado esperado:

- Frontend desacoplado de imports locales de imágenes.

---

## Sprint 3 - Contenido y captación

Objetivo:

- Conectar todas las pantallas informativas/comerciales que hoy están a medio camino.

- Blog (`GET /api/blog`, `GET /api/blog/:slug`).
- Formulario de contacto (`POST /api/contact/messages`).
- Newsletter (`POST /api/newsletter/subscribe`).
- Leads de Club (`POST /api/club/leads`).
- Validación de payloads y respuestas homogéneas.
- Rate limiting básico para evitar abuso.

Resultado esperado:

- Todo formulario del frontend persiste datos reales.

---

## Sprint 4 - Auth, carrito y pedidos (MVP)

Objetivo:

- Tener flujo comercial mínimo funcional antes de meter pagos.

- Auth básica (register, login, refresh, logout).
- Modelos: `User`, `Cart`, `Order`.
- Endpoints de carrito (CRUD de ítems).
- Creación de pedidos sin pago aún.
- Estados de pedido base (`pending`, `canceled`).

Resultado esperado:

- Un usuario autenticado puede preparar un carrito y generar un pedido.

---

## Sprint 4.5 - Pagos con Stripe (modo test)

Objetivo:

- Completar el flujo de compra end-to-end sin necesidad de entorno productivo real.

- Creación de `PaymentIntent` desde backend.
- Confirmación de pago desde frontend (Stripe Elements).
- Webhook de Stripe para actualizar estado del pedido.
- Idempotencia mínima para evitar doble cobro.
- Estados de pago/pedido (`pending`, `paid`, `failed`, `canceled`).

Notas:

- Todo en modo test con tarjetas de prueba.

Resultado esperado:

- Demo funcional de checkout realista para portfolio.

Guia operativa Stripe CLI (demo local):

1. Autenticacion de CLI:

- `stripe login`

2. Escucha y forwarding de webhook al backend local:

- `stripe listen --forward-to localhost:4000/api/payments/webhook`

3. Copiar el signing secret mostrado por CLI (`whsec_...`) a `backend/.env`:

- `STRIPE_WEBHOOK_SECRET=whsec_...`

4. Disparar eventos de prueba:

- `stripe trigger payment_intent.succeeded`
- `stripe trigger payment_intent.payment_failed`

5. Verificacion esperada:

- El backend responde `200` al webhook.
- El pedido cambia de estado segun evento (`paid` o `failed`).

---

## Sprint 5 - Hardening y release

Objetivo:

- Dejar el backend listo para despliegue serio.

- Seguridad final (CORS, headers, límites por endpoint).
- Observabilidad (logs estructurados y trazabilidad básica).
- Revisión de rendimiento e índices.
- Checklist de despliegue.
- Runbook corto de incidencias.

Resultado esperado:

- Backend estable y mantenible para entorno real.

---

## Orden de ejecución acordado

1. Sprint 1
2. Sprint 2
3. Sprint 3
4. Sprint 4
5. Sprint 4.5
6. Sprint 5

## Definición de cierre del roadmap

backend completo cuando:

1. Frontend ya no depende de mocks para catálogo, contenido y flujo de compra.
2. Imágenes salen desde Cloudinary optimizadas.
3. Checkout funciona con Stripe test end-to-end.
4. Hay tests mínimos de rutas críticas y checklist de release.
