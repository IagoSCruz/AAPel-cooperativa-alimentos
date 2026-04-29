#!/usr/bin/env bash
# ============================================================================
# AAPel — VPS bootstrap (Ubuntu 24.04 LTS)
# ============================================================================
# Idempotent: safe to run multiple times. Run as root the first time.
#
# What it does:
#   1. Updates apt + installs baseline packages
#   2. Configures unattended-upgrades for security patches
#   3. Installs Docker Engine + Compose plugin from upstream apt repo
#   4. Creates `deploy` user (in docker group) for unprivileged ops
#   5. Configures UFW firewall (22/80/443 only) and fail2ban
#   6. Prepares /etc/aapel/secrets and /var/lib/aapel
#
# Next steps after running:
#   1. Add your SSH public key to /home/deploy/.ssh/authorized_keys
#   2. ssh deploy@<vps-ip>
#   3. git clone <repo> /home/deploy/aapel && cd /home/deploy/aapel
#   4. sudo bash scripts/setup-secrets.sh
#   5. bash scripts/deploy.sh
# ============================================================================

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
    echo "ERROR: run as root (or with sudo)." >&2
    exit 1
fi

UBUNTU_CODENAME="$(. /etc/os-release && echo "${VERSION_CODENAME}")"
DOCKER_KEY=/etc/apt/keyrings/docker.gpg
DOCKER_LIST=/etc/apt/sources.list.d/docker.list

log() { echo "[$(date +%H:%M:%S)] $*"; }

# ---------------------------------------------------------------------------
log "==> Updating apt + base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y --no-install-recommends

apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg lsb-release \
    ufw fail2ban unattended-upgrades \
    git vim htop tmux rsync s3cmd

# ---------------------------------------------------------------------------
log "==> Configuring unattended-upgrades (security only)"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
dpkg-reconfigure -f noninteractive unattended-upgrades

# ---------------------------------------------------------------------------
log "==> Installing Docker Engine + Compose plugin"
if ! command -v docker &>/dev/null; then
    install -m 0755 -d "$(dirname "$DOCKER_KEY")"
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o "$DOCKER_KEY"
    chmod a+r "$DOCKER_KEY"
    echo "deb [arch=$(dpkg --print-architecture) signed-by=$DOCKER_KEY] \
https://download.docker.com/linux/ubuntu $UBUNTU_CODENAME stable" \
        > "$DOCKER_LIST"
    apt-get update -y
    apt-get install -y \
        docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
fi

# ---------------------------------------------------------------------------
log "==> Creating deploy user"
if ! id deploy &>/dev/null; then
    useradd -m -s /bin/bash -G docker deploy
    install -d -m 0700 -o deploy -g deploy /home/deploy/.ssh
    log "    NOTE: add your SSH public key to /home/deploy/.ssh/authorized_keys"
fi

# Always ensure deploy is in the docker group
usermod -aG docker deploy

# ---------------------------------------------------------------------------
log "==> Configuring UFW (deny incoming, allow 22/80/443)"
ufw --force reset >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP (Caddy ACME)'
ufw allow 443/tcp comment 'HTTPS (Caddy)'
ufw allow 443/udp comment 'HTTP/3 (Caddy)'
ufw --force enable

# ---------------------------------------------------------------------------
log "==> Configuring fail2ban (default sshd jail)"
systemctl enable --now fail2ban

# ---------------------------------------------------------------------------
log "==> Preparing /etc/aapel/secrets and /var/lib/aapel"
install -d -m 0750 -o root -g docker /etc/aapel/secrets
install -d -m 0755 /var/lib/aapel
install -d -m 0755 /var/lib/aapel/backups

# Pre-create /home/deploy/aapel for git clone
install -d -m 0755 -o deploy -g deploy /home/deploy/aapel

log ""
log "==> Bootstrap complete."
log "    Next:"
log "      1. echo '<your-ssh-pubkey>' >> /home/deploy/.ssh/authorized_keys"
log "      2. ssh deploy@<vps-ip>"
log "      3. git clone <repo> /home/deploy/aapel && cd /home/deploy/aapel"
log "      4. sudo bash scripts/setup-secrets.sh"
log "      5. bash scripts/deploy.sh"
