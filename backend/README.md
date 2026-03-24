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

Checklist de despliegue (operativo):

1. Variables de entorno obligatorias

Backend (`backend/.env`):

- `NODE_ENV=production`
- `PORT`
- `API_PREFIX`
- `CORS_ORIGIN` (sin `*` en produccion)
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`

Frontend (`frontend/.env`):

- `VITE_API_BASE_URL`
- `VITE_STRIPE_PUBLISHABLE_KEY`

2. Orden de despliegue sugerido

- Desplegar backend y validar conectividad con MongoDB.
- Ejecutar seeds requeridos segun entorno:
  - `npm run seed:products`
  - `npm run seed:content`
  - `npm run seed:admin`
- Desplegar frontend apuntando a backend ya activo.
- Configurar Stripe webhook al endpoint productivo:
  - `POST <backend-url>/api/payments/webhook`

3. Verificaciones post-deploy

- Salud de servicio:
  - `GET /api/health` -> `200`
  - `GET /api/ready` -> `200`
- Smoke backend:
  - `npm run typecheck`
  - `npm run smoke:all`
  - `npm run smoke:performance`
- Flujo funcional minimo:
  - register/login
  - add to cart
  - create order
  - create payment intent
  - confirmar pago test (incluyendo 3DS)
  - verificar webhook `200` y cambio de estado de pedido

4. Criterios de salida de deploy

- No errores `5xx` en health/smoke.
- Webhook Stripe recibe y procesa eventos con `200`.
- Pedidos transicionan correctamente (`pending`, `paid`, `failed`, `canceled`).
- Panel admin accesible solo con rol `admin`.

5. Rollback minimo

- Revertir frontend a ultimo build estable.
- Revertir backend a ultimo commit/tag estable.
- Mantener `MONGODB_DB_NAME` estable; no correr seeds destructivos durante rollback.
- Revalidar:
  - `GET /api/health`
  - login
  - checkout test basico
  - webhook `200`

Runbook corto de incidencias (operativo):

1. Incidencia: webhook Stripe invalido o no recibido

Sintomas:

- Pedido no cambia de `pending` a `paid`/`failed`.
- Errores `400 Invalid webhook signature`.

Diagnostico rapido:

- Verificar `STRIPE_WEBHOOK_SECRET` en backend.
- Confirmar que Stripe envia a `POST /api/payments/webhook`.
- Revisar logs por `eventType` y `requestId`.

Accion correctiva:

- Regenerar/actualizar signing secret.
- Reconfigurar forwarding o endpoint productivo en Stripe.
- Reenviar evento desde Stripe Dashboard/CLI.

Validacion de cierre:

- Webhook responde `200`.
- Pedido cambia al estado esperado.

2. Incidencia: pedido queda en pending demasiado tiempo

Sintomas:

- Checkout confirma en UI, pero pedido sigue `pending`.

Diagnostico rapido:

- Consultar estado real del `payment_intent` en Stripe.
- Revisar `paymentIntentId` en pedido.
- Verificar llegada de eventos de webhook.

Accion correctiva:

- Reintentar pago desde checkout si aplica.
- Forzar reconciliacion consultando estado de intent y actualizando pedido.

Validacion de cierre:

- Pedido termina en `paid` o `failed`.
- Carrito queda sincronizado.

3. Incidencia: pago falla de forma recurrente

Sintomas:

- Multiples `payment_intent.payment_failed`.
- Usuario no puede completar compra.

Diagnostico rapido:

- Revisar `paymentLastError` del pedido.
- Revisar tipo de tarjeta de prueba usada y escenario Stripe.

Accion correctiva:

- Solicitar nuevo intento con otra tarjeta de prueba.
- Confirmar que el intento no esta bloqueado por estado `canceled`/`paid`.

Validacion de cierre:

- Se crea/recupera intent valido.
- Pedido cambia a `paid` en un nuevo intento exitoso.

4. Incidencia: desincronizacion carrito/pedido

Sintomas:

- Pedido ya `paid` y UI aun muestra items en carrito.

Diagnostico rapido:

- Confirmar ejecucion de webhook `payment_intent.succeeded`.
- Revisar logs de limpieza de carrito.

Accion correctiva:

- Refrescar estado de carrito desde backend.
- Si persiste, limpiar carrito server-side para el usuario afectado.

Validacion de cierre:

- Carrito en `0` items en backend y frontend.

5. Incidencia: acceso admin denegado

Sintomas:

- `403 Admin access required` en `/api/admin/*`.

Diagnostico rapido:

- Verificar rol `admin` en usuario.
- Verificar que access token actual contiene rol correcto.

Accion correctiva:

- Actualizar rol del usuario a `admin`.
- Volver a iniciar sesion para emitir token nuevo con rol actualizado.

Validacion de cierre:

- Endpoints admin responden `200` con el nuevo token.

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
