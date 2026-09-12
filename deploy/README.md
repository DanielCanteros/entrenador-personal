# Despliegue

Arquitectura recomendada (gratis):

- **Backend** (API Express + subida de imágenes): VM **Always Free** de Oracle Cloud.
- **Base de datos**: clúster **M0 (Free Tier, 512 MB)** de MongoDB Atlas.
- **Frontend** (Next.js): **Vercel** (plan Hobby, gratis), con dominio propio.

También se documenta la alternativa de servir el frontend en la misma VM de Oracle con PM2 + Nginx, por si prefieres no depender de Vercel.

## 1. MongoDB Atlas (base de datos)

1. Crea una cuenta gratuita en [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Crea un clúster **M0** (gratuito).
3. En "Database Access", crea un usuario con contraseña.
4. En "Network Access", añade la IP pública de tu VM de Oracle (o `0.0.0.0/0` para empezar rápido, y restríngelo después).
5. Copia el connection string (`mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/entrenador-personal`) — lo necesitarás como `MONGODB_URI`.

## 2. VM de Oracle Cloud (backend)

1. En Oracle Cloud, crea una instancia **Always Free**:
   - `VM.Standard.A1.Flex` (Ampere, hasta 4 OCPU / 24 GB — recomendado), o
   - `VM.Standard.E2.1.Micro` (AMD, 1/8 OCPU / 1 GB — más limitada).
   - Imagen: Ubuntu 22.04 o 24.04 LTS.
2. En la Security List / NSG de la subred, abre los puertos **22** (SSH), **80** y **443**.
3. Conéctate por SSH y ejecuta [`setup-oracle-vm.sh`](./setup-oracle-vm.sh) (instala Node 20, PM2, Nginx y Certbot, y configura el firewall `ufw`).
4. Sube el contenido de `backend/` a `/opt/entrenador-personal/backend` (git clone o `rsync`).
5. Crea `backend/.env` a partir de `backend/.env.example`, con:
   - `MONGODB_URI` del paso 1.
   - `FRONTEND_URL` = tu dominio del frontend (con https).
   - `BASE_URL` = `https://api.tudominio.com` (la URL pública de esta misma API).
   - `JWT_SECRET` largo y aleatorio.
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` del usuario del CMS.
6. Instala dependencias y crea el usuario admin:
   ```bash
   cd /opt/entrenador-personal/backend
   npm ci --omit=dev
   npm run seed:admin
   ```
7. Copia [`ecosystem.config.cjs`](./ecosystem.config.cjs) a `/opt/entrenador-personal/` y arranca la API con PM2:
   ```bash
   pm2 start /opt/entrenador-personal/ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```
8. Configura Nginx con [`nginx.conf.example`](./nginx.conf.example) para `api.tudominio.com` y, cuando el DNS ya apunte a la VM:
   ```bash
   sudo certbot --nginx -d api.tudominio.com
   ```
9. Verifica: `https://api.tudominio.com/api/health` debe responder `{"ok":true,...}`.

### Backups

El tier M0 de Atlas no incluye backups automáticos. Para un sitio pequeño, una opción sencilla es programar un `mongodump` periódico (cron) hacia un almacenamiento externo (por ejemplo, Oracle Object Storage, también con capa gratuita). No es imprescindible para arrancar, pero se recomienda antes de tener contenido importante en el blog.

## 3. Frontend en Vercel (recomendado)

1. Importa el repositorio en [vercel.com](https://vercel.com), seleccionando `frontend/` como **Root Directory**.
2. Variables de entorno (Project Settings → Environment Variables):
   - `NEXT_PUBLIC_API_URL` = `https://api.tudominio.com`
   - `NEXT_PUBLIC_SITE_URL` = `https://tudominio.com`
   - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (opcional)
3. Despliega y conecta tu dominio propio en Project Settings → Domains.
4. Vuelve al backend y actualiza `FRONTEND_URL` en su `.env` con el dominio final, luego reinicia: `pm2 restart entrenador-personal-api`.

## Alternativa: frontend también en la VM de Oracle

Si prefieres no usar Vercel:

```bash
cd /opt/entrenador-personal/frontend
npm ci
npm run build
pm2 start npm --name entrenador-personal-web -- start
```

Y añade el segundo `server{}` (comentado) de [`nginx.conf.example`](./nginx.conf.example) para `tudominio.com`, con su propio `certbot --nginx -d tudominio.com -d www.tudominio.com`. Ten en cuenta que en una VM `E2.1.Micro` (1 GB RAM) ejecutar frontend + backend a la vez puede ir muy justo de memoria; la VM `A1.Flex` (Ampere) tiene más margen.
