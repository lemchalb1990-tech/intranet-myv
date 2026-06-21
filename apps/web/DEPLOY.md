# Guía de Despliegue en EasyPanel

## Requisitos previos
- Cuenta en EasyPanel con un servidor activo
- Repositorio en GitHub: `lemchalb1990-tech/intranet-myv`

---

## Paso 1 — Conectar GitHub a EasyPanel

1. Inicia sesión en tu panel de EasyPanel
2. Ve a **Settings** → **GitHub**
3. Haz clic en **Connect GitHub**
4. Autoriza el acceso a tu cuenta `lemchalb1990-tech`
5. Selecciona el repositorio `intranet-myv` (o "All repositories")

---

## Paso 2 — Crear el proyecto

1. En el panel principal haz clic en **+ Create Project**
2. Escribe el nombre: `intranet-myv`
3. Haz clic en **Create**

---

## Paso 3 — Agregar la base de datos PostgreSQL

1. Dentro del proyecto, haz clic en **+ Create Service**
2. Selecciona **Postgres**
3. Nombre del servicio: `db`
4. Haz clic en **Create**
5. Espera que el servicio quede en estado **Running**
6. Haz clic en el servicio `db` → pestaña **General**
7. Copia la **Connection String** que tiene este formato:
   ```
   postgresql://postgres:PASSWORD@intranet-myv_db:5432/intranet_myv
   ```
   Guárdala, la necesitas en el paso 5.

---

## Paso 4 — Agregar el servicio de la aplicación

1. En el proyecto haz clic en **+ Create Service**
2. Selecciona **App**
3. Nombre del servicio: `app`
4. Haz clic en **Create**

---

## Paso 5 — Configurar el servicio App

### 4a. Fuente del código
1. Pestaña **Source**
2. Selecciona **GitHub**
3. Repositorio: `lemchalb1990-tech/intranet-myv`
4. Branch: `master`
5. Haz clic en **Save**

### 4b. Variables de entorno
1. Pestaña **Environment**
2. Agrega las siguientes variables una por una:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | La connection string del paso 3 |
| `JWT_SECRET` | Una clave aleatoria larga (ver nota abajo) |
| `NEXT_PUBLIC_APP_URL` | `https://app.tu-servidor.easypanel.host` |
| `UPLOAD_DIR` | `/app/uploads` |
| `NODE_ENV` | `production` |

> **Cómo generar JWT_SECRET:** Usa este valor o uno similar:
> `k8mX2pQ7nR4vL9wA1zE6sB3jF5tY0cU`
> (cualquier string larga y aleatoria sirve)

3. Haz clic en **Save**

### 4c. Volumen para archivos subidos
1. Pestaña **Mounts**
2. Haz clic en **+ Add Mount**
3. Tipo: **Volume**
4. Nombre del volumen: `uploads`
5. Mount path: `/app/uploads`
6. Haz clic en **Save**

### 4d. Dominio
1. Pestaña **Domains**
2. EasyPanel te asigna un subdominio automático, por ejemplo:
   `app.tu-servidor.easypanel.host`
3. Copia ese dominio y **actualiza** la variable `NEXT_PUBLIC_APP_URL` con él
4. Activa **HTTPS** (debería estar activo por defecto)

### 4e. Build
1. Pestaña **General**
2. En **Build Command** asegúrate de que esté vacío (el Dockerfile lo maneja)
3. En **Dockerfile Path**: `Dockerfile`
4. Haz clic en **Save**

---

## Paso 6 — Primer despliegue

1. En la pestaña **Deployments** haz clic en **Deploy**
2. Espera que el build termine (puede tardar 3-5 minutos la primera vez)
3. El estado debe cambiar a **Running** ✅

---

## Paso 7 — Inicializar la base de datos

Una vez que el servicio esté en estado **Running**:

1. Haz clic en el servicio `app`
2. Ve a la pestaña **Terminal** (o **Console**)
3. Ejecuta los siguientes comandos uno por uno:

```bash
npx prisma migrate deploy
```
> Crea todas las tablas en la base de datos.

```bash
node -e "
const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
async function main() {
  const exists = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (exists) { console.log('Ya inicializado'); return; }
  const pass = await bcrypt.hash('admin123', 12);
  await prisma.user.create({ data: { rut: '111111119', name: 'Super Administrador', email: 'admin@intranet.cl', password: pass, role: 'SUPER_ADMIN' } });
  await prisma.projectStatus.createMany({ data: [{ name: 'En Blanco', color: '#94a3b8', order: 0 }, { name: 'En Verde', color: '#86efac', order: 1 }, { name: 'Entrega Inmediata', color: '#fcd34d', order: 2 }] });
  await prisma.settings.create({ data: { platformName: 'Intranet MYV', primaryColor: '#475569', accentColor: '#0f172a' } });
  console.log('Base de datos inicializada');
}
main().catch(console.error).finally(() => prisma.\$disconnect());
"
```
> Crea el super administrador y los estados iniciales.

---

## Paso 8 — Acceder al sistema

Abre en tu navegador: `https://app.tu-servidor.easypanel.host`

### Credenciales del Super Administrador inicial

| Campo | Valor |
|-------|-------|
| **RUT** | `11.111.111-9` |
| **Contraseña** | `admin123` |

> ⚠️ **Cambia la contraseña** desde Configuración después del primer login.

---

## Paso 9 — Configurar la plataforma

Una vez dentro del panel admin:

1. Ve a **Configuración**
2. Cambia el **nombre de la plataforma** (ej: "Intranet Inmobiliaria MYV")
3. Sube el **logo** de la empresa
4. Selecciona los **colores** corporativos
5. Configura el **email** (SMTP o Resend) para que lleguen las notificaciones

---

## Actualizaciones futuras

Cada vez que hagas cambios y los subas a GitHub (`git push`), EasyPanel puede redesplegar automáticamente:

1. En EasyPanel, pestaña **Source** del servicio `app`
2. Activa **Auto Deploy on Push**

O manualmente: pestaña **Deployments** → **Deploy**.

---

## Solución de problemas comunes

| Problema | Solución |
|----------|----------|
| Error `DATABASE_URL` | Verifica que la connection string incluya el nombre de la BD al final |
| Build falla | Revisa los logs en la pestaña Deployments → clic en el build fallido |
| No llegan emails | Verifica las credenciales SMTP en Configuración, revisa el puerto y SSL |
| Archivos no se suben | Verifica que el volumen `/app/uploads` esté montado correctamente |
| Página en blanco | Revisa logs en tiempo real: pestaña Logs del servicio app |
