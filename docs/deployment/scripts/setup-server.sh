#!/bin/bash

# BookDress Server Setup Script
# This script prepares a fresh Ubuntu server for BookDress dress rental system deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Setting up server for BookDress dress rental system deployment${NC}"

# Update system
echo -e "${BLUE}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo -e "${BLUE}📦 Installing essential packages...${NC}"
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    htop \
    nginx

# Install Docker
echo -e "${BLUE}🐳 Installing Docker...${NC}"
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
echo -e "${BLUE}🐳 Installing Docker Compose...${NC}"
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Install Node.js (for PM2 alternative)
echo -e "${BLUE}📦 Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Configure firewall
echo -e "${BLUE}🔥 Configuring firewall...${NC}"
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Configure fail2ban
echo -e "${BLUE}🛡️  Configuring fail2ban...${NC}"
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create swap file (if not exists)
if [ ! -f /swapfile ]; then
    echo -e "${BLUE}💾 Creating swap file...${NC}"
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Optimize system for production
echo -e "${BLUE}⚡ Optimizing system...${NC}"
sudo tee -a /etc/sysctl.conf > /dev/null <<EOF
# BookDress dress rental system optimizations
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_fin_timeout = 30
fs.file-max = 100000
EOF

sudo sysctl -p

# Set up log directories
echo -e "${BLUE}📝 Setting up logging...${NC}"
sudo mkdir -p /var/log/bookdress
sudo chown www-data:www-data /var/log/bookdress

# Install SSL certificate tool (Certbot)
echo -e "${BLUE}🔒 Installing Certbot for SSL...${NC}"
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

# Create deployment user
echo -e "${BLUE}👤 Setting up deployment user...${NC}"
if ! id "deploy" &>/dev/null; then
    sudo useradd -m -s /bin/bash deploy
    sudo usermod -aG docker deploy
    sudo usermod -aG sudo deploy
    
    # Set up SSH key for deploy user
    sudo mkdir -p /home/deploy/.ssh
    sudo chmod 700 /home/deploy/.ssh
    sudo chown deploy:deploy /home/deploy/.ssh
    
    echo -e "${YELLOW}Please add your SSH public key to /home/deploy/.ssh/authorized_keys${NC}"
fi

# Install monitoring tools
echo -e "${BLUE}📊 Installing monitoring tools...${NC}"
sudo apt install -y netdata

# Configure netdata
sudo tee /etc/netdata/netdata.conf > /dev/null <<EOF
[global]
    default port = 19999
    bind socket to IP = 127.0.0.1
EOF

sudo systemctl restart netdata

echo -e "${GREEN}✅ Server setup completed!${NC}"
echo -e "${BLUE}📋 Setup Summary:${NC}"
echo "- Docker and Docker Compose installed"
echo "- Firewall configured (ports 22, 80, 443 open)"
echo "- Fail2ban configured for security"
echo "- Swap file created (2GB)"
echo "- System optimized for production"
echo "- SSL certificate tool (Certbot) installed"
echo "- Monitoring (Netdata) installed on port 19999"
echo "- Deploy user created"

echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Add your SSH key to /home/deploy/.ssh/authorized_keys"
echo "2. Log out and log back in for Docker group changes to take effect"
echo "3. Run the deployment script
echo "4. Configure your domain and SSL certificates"
echo "5. Set up MongoDB Atlas database"
echo "6. Configure email service (SendGrid, Mailgun, etc.)"
echo "7. Set up SMS service (Twilio)"
echo "8. Configure payment gateways (Stripe, PayPal)"

echo -e "${YELLOW}⚠️  Important Security Notes:${NC}"
echo "- Change default SSH port if needed"
echo "- Set up SSH key authentication and disable password auth"
echo "- Configure automatic security updates"
echo "- Set up backup strategy"
echo "- Monitor logs regularly"

echo -e "${BLUE}🔄 Please log out and log back in for group changes to take effect${NC}"
