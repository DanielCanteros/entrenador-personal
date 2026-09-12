#!/usr/bin/env bash
# Aprovisionamiento inicial de una VM Always Free de Oracle Cloud (Ubuntu 22.04/24.04)
# para alojar el backend (API Express + MongoDB Atlas). Ejecutar como usuario con sudo.
#
# Uso:
#   chmod +x setup-oracle-vm.sh
#   ./setup-oracle-vm.sh
#
# Antes de ejecutar: crea la instancia en Oracle Cloud (Always Free: VM.Standard.A1.Flex
# o VM.Standard.E2.1.Micro), abre los puertos 22, 80 y 443 en la Security List / NSG de
# la subred, y conéctate por SSH.

set -euo pipefail

echo "==> Actualizando paquetes del sistema"
sudo apt-get update -y
sudo apt-get upgrade -y

echo "==> Instalando Node.js 20 LTS"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential

echo "==> Instalando PM2 (gestor de procesos)"
sudo npm install -g pm2

echo "==> Instalando Nginx y Certbot (HTTPS)"
sudo apt-get install -y nginx certbot python3-certbot-nginx

echo "==> Configurando firewall (ufw)"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "==> Creando directorio de despliegue"
sudo mkdir -p /opt/entrenador-personal
sudo chown "$USER":"$USER" /opt/entrenador-personal

cat <<'EOF'

Siguientes pasos manuales:

1. Sube el código del backend a /opt/entrenador-personal/backend
   (git clone de tu repositorio, o scp/rsync desde tu máquina).

2. Crea /opt/entrenador-personal/backend/.env a partir de .env.example,
   con tu MONGODB_URI de MongoDB Atlas, JWT_SECRET, FRONTEND_URL, etc.

3. Instala dependencias y siembra el usuario admin:
     cd /opt/entrenador-personal/backend
     npm ci --omit=dev
     npm run seed:admin

4. Copia deploy/ecosystem.config.cjs a /opt/entrenador-personal/ y arráncalo:
     pm2 start /opt/entrenador-personal/ecosystem.config.cjs
     pm2 save
     pm2 startup   (sigue las instrucciones que imprime para arrancar en el boot)

5. Configura Nginx con deploy/nginx.conf.example (ajusta el dominio de la API)
   y, una vez el DNS de api.tudominio.com apunte a esta VM:
     sudo certbot --nginx -d api.tudominio.com

6. Verifica: https://api.tudominio.com/api/health debe responder {"ok":true,...}

EOF
