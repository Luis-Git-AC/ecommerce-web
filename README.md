# Ecommerce Web – Proyecto Fullstack

Aplicación web de ecommerce para tienda de plantas, desarrollada como solución fullstack moderna y escalable. Incluye frontend en React y backend en Node.js, con integración real de pagos mediante Stripe (modo test) y gestión avanzada de catálogo, usuarios y pedidos.

---

## ¿Qué es este proyecto?

Es una plataforma de ecommerce pensada para ofrecer una experiencia de usuario moderna, accesible y robusta, tanto en frontend como en backend. Permite navegar, filtrar y comprar productos, gestionar el carrito, autenticarse, crear pedidos y realizar pagos seguros.

---

## Arquitectura general

- **Frontend:** React 19 + Vite (SPA), diseño responsive, accesibilidad, integración con backend y Stripe.
- **Backend:** Node.js + Express + TypeScript, API RESTful, MongoDB Atlas, Cloudinary para imágenes, Stripe para pagos.
- **Pagos:** Stripe Checkout (modo test), webhooks para gestión automática de pedidos.

Ambos módulos están desacoplados y pueden evolucionar de forma independiente, comunicándose vía API REST.

---

## Funcionalidades principales

- Catálogo de productos dinámico y filtrable
- Vista de producto con galería
- Carrito persistente y gestionable
- Registro/login de usuarios y autenticación JWT
- Creación y consulta de pedidos
- Checkout completo con Stripe (modo test)
- Gestión de estados de pedido tras el pago (webhooks)
- Administración de contenido y usuarios (backend)
- Accesibilidad y diseño responsive

---

## Pagos y seguridad

La aplicación implementa pagos reales en entorno de pruebas mediante Stripe Checkout. El backend gestiona la creación de intents de pago y escucha webhooks para actualizar automáticamente el estado de los pedidos. Todo el flujo es seguro y cumple buenas prácticas de validación y autenticación.

---

## Estructura del repositorio

- `frontend/` – Aplicación React (SPA)
- `backend/` – API REST Node.js
- `README.md` – Este archivo (guía global)
- `frontend/README.md` – Documentación específica del frontend
- `backend/README2.md` – Documentación específica del backend

---

## Puesta en marcha (desarrollo)

1. Clona el repositorio y navega a cada carpeta (`frontend/`, `backend/`)
2. Copia los archivos `.env.example` a `.env` y completa las variables necesarias en ambos módulos
3. Instala dependencias en ambos módulos: `npm install`
4. Arranca backend: `npm run dev` (en `backend/`)
5. Arranca frontend: `npm run dev` (en `frontend/`)

Consulta los README específicos para detalles de scripts, estructura y despliegue.

---

## Estado actual

- Frontend y backend conectados y funcionales
- Pagos Stripe activos (modo test)
- Pruebas de integración y scripts de seed/smoke
- Listo para producción y escalabilidad

---
