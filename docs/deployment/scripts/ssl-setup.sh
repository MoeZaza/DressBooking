#!/bin/bash

# SSL Certificate Setup Script for BookDress
# This script sets up SSL certificates using Let's Encrypt for the dress rental system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔒 Setting up SSL certificates for BookDress dress rental system${NC}"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root${NC}"
   exit 1
fi

# Get domain name
read -p "Enter your domain name (e.g., bookdress.com): " DOMAIN
read -p "Enter your email address for Let's Encrypt: " EMAIL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo -e "${RED}❌ Domain and email are required${NC}"
    exit 1
fi

# Validate domain format
if ! [[ $DOMAIN =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
    echo -e "${RED}❌ Invalid domain format${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Configuration:${NC}"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Stop nginx temporarily
echo -e "${BLUE}⏹️  Stopping nginx...${NC}"
systemctl stop nginx

# Obtain SSL certificate
echo -e "${BLUE}🔒 Obtaining SSL certificate...${NC}"
certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    -d $DOMAIN \
    -d www.$DOMAIN

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSL certificate obtained successfully${NC}"
else
    echo -e "${RED}❌ Failed to obtain SSL certificate${NC}"
    systemctl start nginx
    exit 1
fi

# Create nginx configuration
echo -e "${BLUE}⚙️  Creating nginx configuration...${NC}"
tee /etc/nginx/sites-available/bookdress > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

    # API Routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:4002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Login rate limiting
    location ~ ^/api/(sign-in|sign-up|forgot-password) {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:4002;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files (CDN)
    location /cdn/ {
        alias /var/www/cdn/bookdress/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }

    # Security.txt
    location /.well-known/security.txt {
        return 200 "Contact: mailto:security@$DOMAIN\\nExpires: 2025-12-31T23:59:59.000Z\\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/bookdress /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo -e "${BLUE}🧪 Testing nginx configuration...${NC}"
nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration is invalid${NC}"
    exit 1
fi

# Start nginx
echo -e "${BLUE}▶️  Starting nginx...${NC}"
systemctl start nginx
systemctl enable nginx

# Set up automatic certificate renewal
echo -e "${BLUE}🔄 Setting up automatic certificate renewal...${NC}"
tee /etc/cron.d/certbot > /dev/null <<EOF
# Renew Let's Encrypt certificates
0 12 * * * root test -x /usr/bin/certbot -a \! -d /run/systemd/system && perl -e 'sleep int(rand(43200))' && certbot -q renew --nginx
EOF

# Test certificate renewal
echo -e "${BLUE}🧪 Testing certificate renewal...${NC}"
certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Certificate renewal test successful${NC}"
else
    echo -e "${YELLOW}⚠️  Certificate renewal test failed, but certificates are still valid${NC}"
fi

# Update environment file with domain
echo -e "${BLUE}⚙️  Updating environment configuration...${NC}"
if [ -f "/opt/bookdress/api/.env.production" ]; then
    sed -i "s/yourdomain.com/$DOMAIN/g" /opt/bookdress/api/.env.production
    sed -i "s/BC_HTTPS=false/BC_HTTPS=true/g" /opt/bookdress/api/.env.production
    echo -e "${GREEN}✅ Environment file updated${NC}"
fi

echo -e "${GREEN}🎉 SSL setup completed successfully!${NC}"
echo -e "${BLUE}📋 SSL Setup Summary:${NC}"
echo "- SSL certificates obtained for $DOMAIN and www.$DOMAIN"
echo "- Nginx configured with SSL and security headers"
echo "- Automatic certificate renewal set up"
echo "- HTTP to HTTPS redirect enabled"

echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Update your DNS records to point to this server"
echo "2. Test your domain: https://$DOMAIN"
echo "3. Restart BookDress services if running"
echo "4. Monitor certificate expiration (auto-renewal is set up)"

echo -e "${BLUE}🔗 Useful Commands:${NC}"
echo "- Check certificate status: certbot certificates"
echo "- Renew certificates manually: certbot renew"
echo "- Test nginx config: nginx -t"
echo "- Reload nginx: systemctl reload nginx"
