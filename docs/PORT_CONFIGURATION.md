# 🌐 BookDress Port Configuration

This document defines the standardized port configuration for all BookDress applications and services.

## 📊 Standard Ports

### Development Environment
- **Frontend (Customer App)**: `3000`
- **Backend (Admin Dashboard)**: `3001`
- **API Server**: `4002`

### Additional Services (Docker/Production)
- **MongoDB Express**: `8084`
- **MongoDB (External Access)**: `27018`
- **Nginx (HTTP)**: `80`
- **Nginx (HTTPS)**: `443`

## 🔧 Configuration Files

The following files contain port configurations and should be updated together:

### Frontend Configuration
- `frontend/vite.config.ts` - Development server port
- `frontend/.env.example` - Environment template
- `frontend/.env` - Local environment
- `frontend/.env.docker` - Docker environment

### Backend Configuration
- `backend/vite.config.ts` - Development server port
- `backend/.env.example` - Environment template
- `backend/.env` - Local environment
- `backend/.env.docker` - Docker environment

### API Configuration
- `api/src/config/env.config.ts` - Server port configuration
- `api/.env.example` - Environment template
- `api/.env` - Local environment
- `api/.env.docker` - Docker environment

### Documentation
- `deployment/README.md` - Port documentation
- `deployment/ENVIRONMENT_VARIABLES.md` - Environment variable docs
- `deployment/PREREQUISITES.md` - Prerequisites and port requirements
- `deployment/DEVELOPMENT_GUIDE.md` - Development setup guide

### Scripts
- `setup-bookdress.bat` - Setup script
- `start-dev.bat` - Development startup script
- `start-all.ps1` - PowerShell startup script

## 🚨 Important Notes

1. **Consistency**: All port references must be updated together when changing ports
2. **Environment Variables**: Use environment variables for port configuration where possible
3. **Documentation**: Update this file when making port changes
4. **Testing**: Test all applications after port changes to ensure connectivity

## 🔄 Changing Ports

If you need to change the standard ports:

1. Update the port values in all configuration files listed above
2. Update this documentation
3. Test all applications to ensure they work correctly
4. Update any external documentation or deployment scripts

## 🌍 Environment-Specific Ports

### Local Development
- Uses the standard ports listed above
- No conflicts with system services
- Easy to remember and access

### Docker Development
- Same ports as local development
- Mapped through Docker port forwarding
- Isolated from host system

### Production
- Uses standard HTTP/HTTPS ports (80/443)
- Internal services use different ports
- Secured through firewall and reverse proxy

## 📝 Current Status

✅ **Standardized**: All applications now use consistent port configuration
✅ **Documented**: Port usage is clearly documented
✅ **Centralized**: This file serves as the single source of truth for port configuration
