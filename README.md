# Gestión de Tareas - SaaS Fullstack

Este proyecto es una aplicación completa de gestión de tareas con un diseño moderno tipo SaaS. Está construida con una arquitectura desacoplada: una API RESTful en el backend y una interfaz interactiva en el frontend.

## Tecnologías Utilizadas

- **Next.js**: Framework de React para el frontend (App Router).
- **CSS Modules**: Estilizado de componentes modular y profesional.
- **Lucide React**: Set de iconos minimalistas.
- **Node.js**: Entorno de ejecución para el backend.
- **Express**: Framework web para la API.
- **MongoDB**: Base de datos NoSQL.
- **Mongoose**: ODM para el modelado de datos.
- **CORS & Dotenv**: Seguridad y configuración de entorno.

## Estructura del Proyecto

```text
gestion_tareas/
├── api/                    # Backend (Node.js/Express)
│   ├── src/
│   │   ├── config/         # Conexión a MongoDB
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── models/         # Esquemas de datos (Mongoose)
│   │   └── routes/         # Endpoints de la API
│   └── ...
├── frontend/               # Frontend (Next.js)
│   ├── src/
│   │   ├── app/            # Páginas y estilos globales
│   │   ├── components/     # Componentes de la interfaz
│   │   └── services/       # Cliente de API
│   └── ...
└── README.md
```

## Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd gestion_tareas
   ```

2. **Configurar el Backend:**
   ```bash
   cd api
   npm install
   ```
   Crea un archivo `.env` en `api/`:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/gestion_tareas
   ```

3. **Configurar el Frontend:**
   ```bash
   cd ../frontend
   npm install
   ```
   Crea un archivo `.env.local` en `frontend/`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

## Ejecución

### Backend
```bash
cd api
npm run dev
```

### Frontend
```bash
cd frontend
npm run dev
```
El frontend estará disponible en `http://localhost:3000`.

## Características Avanzadas y Transacciones (ACID)

El sistema ha sido mejorado para garantizar la consistencia de datos mediante transacciones robustas en MongoDB/Mongoose (utilizando **Mongoose Sessions**). Se incluye un mecanismo de *fallback* automático para ejecutar las consultas secuencialmente en entornos de desarrollo local que utilicen MongoDB Standalone (sin soporte nativo de Replica Sets).

### Transacciones Implementadas:

1. **Eliminación Segura de Categoría con Reasignación Automática (Transacción 1)**
   - Al eliminar una categoría que contiene tareas asociadas, el sistema no rechaza la petición ni borra las tareas. En su lugar, mediante una transacción atómica, busca o crea una categoría por defecto llamada **"General"**, migra todas las tareas a esta y posteriormente elimina la categoría seleccionada de forma segura.
   - **Endpoint:** `DELETE /api/categorias/:id`

2. **Desactivación de Usuario con Redistribución de Carga (Transacción 2)**
   - Cuando un administrador desactiva a un usuario (`activo: false`), el sistema busca todas las tareas que el usuario tiene pendientes o en progreso.
   - Mediante una transacción ACID, redistribuye las tareas en formato **Round-Robin** entre el resto de usuarios activos del sistema para evitar tareas huérfanas o la pérdida de carga laboral activa.
   - En caso de que no existan más usuarios activos para asumir la carga, la transacción hace *rollback* y deniega la desactivación por seguridad.
   - **Endpoint:** `PUT /api/usuarios/toggle-status/:id`

---

## Mejoras de Interfaz (UI/UX Premium)

- **Módulo de Reportes Optimizado**: Diseño con cabeceras elegantes y KPI Cards simétricas distribuidas en una única fila en pantallas de escritorio.
- **Scroll Independiente en Módulos**: El layout principal utiliza scroll local (`overflow-y: auto`) únicamente en el módulo activo, manteniendo la barra superior (`Topbar`) y la barra lateral (`Sidebar`) estáticas para mejorar la usabilidad.
- **Tablas Responsivas**: Las tablas de reportes (como la de tareas vencidas o próximas a vencer) soportan títulos de tareas sumamente largos sin desbordarse de la pantalla, usando propiedades CSS de auto-ajuste y un contenedor con scroll horizontal automático en dispositivos móviles.

---

## Endpoints de la API Completos

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/tareas` | Obtener todas las tareas del sistema |
| `POST` | `/api/tareas` | Crear una nueva tarea con responsable y categoría |
| `PUT` | `/api/tareas/:id` | Actualizar una tarea (estado, responsable, etc.) |
| `DELETE` | `/api/tareas/:id` | Eliminar una tarea definitivamente |
| `GET` | `/api/categorias` | Obtener todas las categorías |
| `POST` | `/api/categorias` | Crear una nueva categoría |
| `PUT` | `/api/categorias/:id` | Editar una categoría existente |
| `DELETE` | `/api/categorias/:id` | **(Transaccional)** Eliminar categoría y migrar tareas a "General" |
| `GET` | `/api/usuarios` | Obtener todos los usuarios del sistema |
| `POST` | `/api/usuarios` | Crear un nuevo usuario |
| `PUT` | `/api/usuarios/:id` | Modificar datos del usuario |
| `PUT` | `/api/usuarios/toggle-status/:id` | **(Transaccional)** Alternar estado del usuario y redistribuir tareas si se desactiva |

### Ejemplo de Tarea (JSON):
```json
{
  "title": "Diseñar mockup SaaS",
  "description": "Crear el diseño visual en Figma",
  "categoria": "65b9c02d18721c00f89839ac",
  "assignedTo": "65b9c02d18721c00f89839ab",
  "priority": "high",
  "status": "in_progress",
  "dueDate": "2026-06-15"
}
```

## Notas Adicionales
- La API ha sido completamente adaptada para el manejo de relaciones complejas (`User`, `Tarea`, `Categoria`).
- Al iniciar la API, esta cuenta con inyección de datos iniciales (*seeders*) para categorías por defecto e inyección del usuario administrador principal en caso de bases de datos limpias.
