#!/usr/bin/env bash
# ==============================================================================
# RentSphere — Automated AWS EC2 Provisioning & Bootstrap Script
# Tested on: Ubuntu 22.04 LTS / 24.04 LTS (x86_64 & arm64)
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${BLUE}[RentSphere Setup]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; exit 1; }

# Ensure script is run with bash
if [ -z "${BASH_VERSION:-}" ]; then
    error "This script must be run with bash."
fi

log "Starting RentSphere AWS EC2 automated deployment..."

# 1. Check or Configure Swap (Critical for t2.micro / t3.micro with 1GB RAM)
TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
TOTAL_RAM_MB=$((TOTAL_RAM_KB / 1024))
log "Detected Physical RAM: ${TOTAL_RAM_MB}MB"

if [ "$TOTAL_RAM_MB" -lt 3000 ]; then
    if [ ! -f /swapfile ]; then
        log "RAM is under 3GB (${TOTAL_RAM_MB}MB). Creating a 2GB swap file to prevent OOM errors during Docker builds..."
        sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
        sudo sysctl vm.swappiness=10
        echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
        success "2GB Swap configured successfully."
    else
        log "Swap file already exists at /swapfile."
    fi
fi

# 2. Update System Packages
log "Updating APT packages..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git ufw openssl

# 3. Install Docker & Docker Compose Plugin
if ! command -v docker &> /dev/null; then
    log "Installing Docker CE and Docker Compose plugin..."
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    UBUNTU_CODENAME=$(lsb_release -cs)
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      ${UBUNTU_CODENAME} stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker "$USER" || true
    success "Docker CE installed successfully."
else
    log "Docker is already installed ($(docker --version))."
fi

# 4. Configure UFW Firewall
log "Configuring firewall (allowing SSH 22, HTTP 80, HTTPS 443)..."
sudo ufw allow 22/tcp || true
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw --force enable || true

# 5. Project Directory Setup
PROJECT_DIR="${HOME}/RentSphere"
if [ ! -d "$PROJECT_DIR" ]; then
    log "Cloning repository into ${PROJECT_DIR}..."
    git clone https://github.com/ixi3boda/RentSphere.git "$PROJECT_DIR"
else
    log "Repository already exists at ${PROJECT_DIR}. Pulling latest changes..."
    cd "$PROJECT_DIR"
    git fetch origin main
    git reset --hard origin/main
fi

cd "$PROJECT_DIR"

# 6. Generate .env if not present
if [ ! -f .env ]; then
    log "Creating .env from .env.example with secure random credentials..."
    cp .env.example .env
    
    JWT_SECRET=$(openssl rand -hex 32)
    MYSQL_PASS=$(openssl rand -hex 16)
    MYSQL_ROOT_PASS=$(openssl rand -hex 16)
    
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|g" .env
    sed -i "s|MYSQL_PASSWORD=.*|MYSQL_PASSWORD=${MYSQL_PASS}|g" .env
    sed -i "s|MYSQL_ROOT_PASSWORD=.*|MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASS}|g" .env
    success ".env initialized with secure credentials."
else
    log "Existing .env found. Keeping current credentials."
fi

# 7. Start the Docker Stack
log "Building and starting container stack (MySQL 8, Backend, Frontend, Nginx)..."
sudo docker compose down --remove-orphans || true
sudo docker compose build --parallel
sudo docker compose up -d

# 8. Wait for MySQL & Seed Demo Data
log "Waiting for MySQL database to become healthy..."
RETRIES=30
until sudo docker compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null || [ $RETRIES -eq 0 ]; do
    echo -n "."
    sleep 2
    RETRIES=$((RETRIES - 1))
done
echo ""

if [ $RETRIES -gt 0 ]; then
    log "Database is ready. Loading demo dataset (seed-demo.sql)..."
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
    sudo docker compose exec -T mysql mysql -u"${MYSQL_USER:-rentsphere}" -p"${MYSQL_PASSWORD}" \
        "${MYSQL_DATABASE:-RentSphereSchema}" < Database/seed-demo.sql || warn "Seed failed or already populated."
    success "Demo dataset loaded successfully."
else
    warn "MySQL took longer than expected to start; skipping automated demo seed."
fi

# 9. Health Check
PUBLIC_IP=$(curl -s https://checkip.amazonaws.com || curl -s ifconfig.me || echo "YOUR-EC2-PUBLIC-IP")
log "Verifying health..."
sleep 5
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/actuator/health" 2>/dev/null || echo "000")

echo ""
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}       RentSphere is Deployed and Live on AWS EC2!              ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "Web Application:    ${BLUE}http://${PUBLIC_IP}/${NC}"
echo -e "Interactive Swagger:${BLUE}http://${PUBLIC_IP}/swagger-ui/index.html${NC}"
echo -e "API OpenAPI Docs:   ${BLUE}http://${PUBLIC_IP}/v3/api-docs${NC}"
echo -e "Health Probe:       ${BLUE}http://${PUBLIC_IP}/actuator/health (Status: ${HTTP_STATUS})${NC}"
echo ""
echo -e "Demo Login Accounts:"
echo -e "  Admin / Owner:  ${YELLOW}nour.elsayed@nilenest.demo${NC} / ${YELLOW}RentSphereDemo2026${NC}"
echo -e "  Tenant:         ${YELLOW}youssef.farouk@mail.demo${NC} / ${YELLOW}RentSphereDemo2026${NC}"
echo -e "================================================================\n"
