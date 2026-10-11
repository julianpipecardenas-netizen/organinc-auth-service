# organinc-auth-service

Microservicio de autenticación para el prototipo de 3D Organ Inc. Expone `/api/register` y `/api/login`, valida credenciales contra una tabla `users` alojada en Supabase (Postgres) y devuelve un JWT que la app en React Native guarda para mantener la sesión.

## 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto nuevo (o usa uno existente).
2. Ve a **SQL Editor** y ejecuta el contenido de `supabase/schema.sql` para crear la tabla `users`.
3. Ve a **Project Settings → API** y copia:
   - `Project URL` → será tu `SUPABASE_URL`
   - `service_role` key (no la `anon` key) → será tu `SUPABASE_SERVICE_ROLE_KEY`

   La `service_role` key tiene permisos completos sobre la base de datos — **nunca la pongas en el código de la app móvil**, solo vive en el servidor.

## 2. Configurar el microservicio

```bash
cp .env.example .env
```

Edita `.env` y pega tu `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, y genera un `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Instala dependencias y corre en local:

```bash
npm install
npm run dev
```

Prueba que esté vivo:

```bash
curl http://localhost:4000/health
```

## 3. Endpoints

| Método | Ruta            | Body                          | Respuesta                          |
|--------|-----------------|--------------------------------|-------------------------------------|
| POST   | `/api/register` | `{ "username", "password" }`  | `201` → `{ token, user }`          |
| POST   | `/api/login`    | `{ "username", "password" }`  | `200` → `{ token, user }`          |
| GET    | `/api/me`       | header `Authorization: Bearer <token>` | `200` → `{ id, username }` |

Reglas de validación: usuario con mínimo 3 caracteres, contraseña con mínimo 6. Las contraseñas se guardan con `bcrypt` (nunca en texto plano).

## 4. Desplegar (siguiendo el mismo patrón que ya usas en tus otros proyectos: microservicio en Render + Supabase)

1. Sube esta carpeta a un repositorio de GitHub.
2. En [Render](https://render.com), crea un **Web Service** nuevo apuntando a ese repositorio.
   - Build command: `npm install`
   - Start command: `npm start`
3. En la sección **Environment**, agrega las mismas variables de `.env` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`).
4. Una vez desplegado, Render te da una URL pública (algo como `https://organinc-auth-service.onrender.com`) — esa es la que la app React Native va a consumir.

## 5. Conectar la app React Native

En el proyecto de la app, crea un `.env` (o usa `app.json` → `extra`) con:

```
EXPO_PUBLIC_AUTH_API_URL=https://organinc-auth-service.onrender.com
```

(para probar en local mientras desarrollas, usa `http://TU-IP-LOCAL:4000` en vez de la URL de Render — `localhost` no es alcanzable desde el celular físico ni desde el emulador de Android sin ajustes).

El `AuthContext.tsx` del prototipo ya quedó adaptado para llamar a `${EXPO_PUBLIC_AUTH_API_URL}/api/login` y `/api/register`. Ver el proyecto de la app para el detalle.
