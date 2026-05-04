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

## Endpoints de la API

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/tareas` | Obtener todas las tareas |
| `POST` | `/api/tareas` | Crear una nueva tarea |
| `PUT` | `/api/tareas/:id` | Actualizar una tarea (incluye cambio de estado) |
| `DELETE` | `/api/tareas/:id` | Eliminar una tarea |

### Ejemplo de Tarea (JSON):
```json
{
  "title": "Diseñar mockup SaaS",
  "description": "Crear el diseño visual en Figma",
  "project": { "name": "Frontend" },
  "priority": "high",
  "status": "in_progress",
  "dueDate": "2024-05-10"
}
```

## Notas
- El frontend utiliza un diseño responsivo y moderno con modales personalizados para creación y confirmación de eliminación.
- La API ha sido extendida para soportar campos avanzados como prioridades, etiquetas y responsables asignados.
- El buscador en el frontend permite filtrar tareas por título, descripción o proyecto en tiempo real.
