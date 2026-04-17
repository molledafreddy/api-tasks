# 📝 API Tasks

REST API de gestión de tareas (To-Do) — NestJS · TypeScript · PostgreSQL · Redis · Docker

## 🚀 Ejecución local

Requisitos: **Docker** y **Docker Compose** (v2+).

```bash
cp .env.example .env
docker compose up --build
```

> Si el puerto 3000 está ocupado, edita `API_HOST_PORT` en `.env` (ej: `API_HOST_PORT=3001`).

### URLs

| Recurso | URL |
|---------|-----|
| API | `http://localhost:3001/api` |
| Swagger UI | `http://localhost:3001/api/docs` |
| Health check | `http://localhost:3001/api/health` |

## 📡 Endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/health` | Health check (DB + Redis) | ❌ |
| `POST` | `/api/auth/register` | Registrar usuario | ❌ |
| `POST` | `/api/auth/login` | Login → JWT | ❌ |
| `GET` | `/api/auth/me` | Usuario autenticado | ✅ |
| `POST` | `/api/tasks` | Crear tarea | ✅ |
| `GET` | `/api/tasks` | Listar tareas (paginado, filtro por status) | ✅ |
| `GET` | `/api/tasks/:id` | Obtener tarea | ✅ |
| `PATCH` | `/api/tasks/:id` | Actualizar tarea | ✅ |
| `DELETE` | `/api/tasks/:id` | Eliminar tarea | ✅ |

> Endpoints con Auth ✅ requieren header: `Authorization: Bearer <token>`

## 🔐 Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string PostgreSQL | (docker-compose lo configura) |
| `REDIS_URL` | Connection string Redis | (docker-compose lo configura) |
| `JWT_SECRET` | Secreto para JWT (min 32 chars) | — |
| `JWT_EXPIRES_IN` | Expiración del token | `1h` |
| `CACHE_TTL_SECONDS` | TTL caché Redis | `60` |
| `API_HOST_PORT` | Puerto expuesto en el host | `3000` |

## 🧪 Tests

```bash
# Unit tests (16 tests)
npx jest --verbose

# E2E tests (17 tests) — requiere postgres + redis corriendo
docker compose up -d postgres redis
npx jest --config test/jest-e2e.json --verbose --forceExit
```

## 📚 Detalle

Ver el código fuente y los comentarios en cada módulo para entender la arquitectura y decisiones de diseño.
