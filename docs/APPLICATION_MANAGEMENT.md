# 👗 BookDress Application Management Guide

This guide explains how to manage all BookDress applications (API, Backend, Frontend) using the new unified management system.

## 🚀 Quick Start

### Start All Applications
```bash
# Using npm scripts (recommended)
npm run start:all

# Using batch files (Windows)
start-apps.bat start

# Using PowerShell (Windows)
.\start-all.ps1 start
```

### Stop All Applications
```bash
# Using npm scripts (recommended)
npm run stop:all

# Using batch files (Windows)
stop-apps.bat

# Using PowerShell (Windows)
.\start-all.ps1 stop
```

### Restart All Applications
```bash
# Using npm scripts (recommended)
npm run restart:all

# Using batch files (Windows)
restart-apps.bat

# Using PowerShell (Windows)
.\start-all.ps1 restart
```

### Check Application Status
```bash
# Using npm scripts (recommended)
npm run status:all

# Using batch files (Windows)
status-apps.bat

# Using PowerShell (Windows)
.\start-all.ps1 status
```

## 📱 Application URLs

When running, your applications will be available at:

- **Frontend (Customer App)**: http://localhost:3000
- **Backend (Admin Dashboard)**: http://localhost:3001  
- **API Server**: http://localhost:4002

## 🛠️ Available Commands

### NPM Scripts (Cross-platform)
| Command | Description |
|---------|-------------|
| `npm run start:all` | Start all applications in background |
| `npm run stop:all` | Stop all running applications |
| `npm run restart:all` | Restart all applications |
| `npm run status:all` | Check status of all applications |

### Windows Batch Files
| File | Description |
|------|-------------|
| `start-apps.bat start` | Start all applications |
| `stop-apps.bat` | Stop all applications |
| `restart-apps.bat` | Restart all applications |
| `status-apps.bat` | Check application status |

### PowerShell Script (Windows)
```powershell
.\start-all.ps1 [action]
```
Where `[action]` can be: `start`, `stop`, `restart`, `status`

## 🔧 How It Works

### Process Management
- Applications run as background processes
- Process IDs (PIDs) are saved to `.bookdress-pids.json`
- Cross-platform process management (Windows/Unix)
- Automatic port cleanup when stopping

### Status Monitoring
- Real-time port availability checking
- Process health monitoring
- Environment file validation
- System information display

### Smart Stopping
The stop script uses multiple methods to ensure clean shutdown:
1. **PID-based stopping**: Uses saved process IDs
2. **Process name matching**: Finds Node.js processes running dev scripts
3. **Port-based cleanup**: Frees up application ports (3000, 3001, 4002)

## 🛡️ Security Features

### Environment File Checking
- Validates presence of required environment files
- Prefers secure `.env.local` files over basic `.env` files
- Warns about missing or insecure configurations

### Process Isolation
- Each application runs in its own process
- Clean process termination prevents resource leaks
- Automatic cleanup of orphaned processes

## 🔍 Troubleshooting

### Applications Won't Start
1. Check if ports are already in use:
   ```bash
   npm run status:all
   ```

2. Stop any existing processes:
   ```bash
   npm run stop:all
   ```

3. Try starting again:
   ```bash
   npm run start:all
   ```

### Applications Won't Stop
1. Use the comprehensive stop script:
   ```bash
   npm run stop:all
   ```

2. If processes persist, manually kill Node.js processes:
   ```bash
   # Windows
   taskkill /f /im node.exe
   
   # Unix/Linux/macOS
   pkill -f node
   ```

### Port Conflicts
If you get "port already in use" errors:

1. Check what's using the ports:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   netstat -ano | findstr :4002
   
   # Unix/Linux/macOS
   lsof -i :3000
   lsof -i :3001
   lsof -i :4002
   ```

2. Stop the conflicting processes:
   ```bash
   npm run stop:all
   ```

### Environment Issues
1. Ensure environment files exist:
   - `api/.env.local` (preferred) or `api/.env`
   - `backend/.env`
   - `frontend/.env`

2. Check environment file templates:
   - `api/.env.example`
   - `backend/.env.example`
   - `frontend/.env.example`

## 📊 Status Information

The status command provides:
- **Process Status**: Whether each application process is running
- **Port Status**: Whether each port is responding to requests
- **Environment Status**: Configuration file validation
- **System Information**: Platform, Node.js version, uptime
- **Management Commands**: Available actions

## 🔄 Migration from Old Scripts

### Old Way
```bash
# Multiple terminal windows required
cd api && npm run dev
cd backend && npm run dev  
cd frontend && npm run dev
```

### New Way
```bash
# Single command, background processes
npm run start:all
```

### Benefits
- ✅ Single command to manage all applications
- ✅ Background processes (no multiple terminal windows)
- ✅ Proper process cleanup
- ✅ Status monitoring
- ✅ Cross-platform compatibility
- ✅ Automatic port management

## 🎯 Best Practices

1. **Always use the management scripts** instead of starting applications individually
2. **Check status before starting** to avoid conflicts
3. **Use stop:all before restart:all** for clean restarts
4. **Monitor logs** through the status command
5. **Keep environment files secure** (use `.env.local` for sensitive data)

## 📝 Logs and Debugging

### View Application Logs
Applications run in background, but you can monitor them:

```bash
# Check overall status
npm run status:all

# For detailed debugging, start individual apps:
cd api && npm run dev
cd backend && npm run dev
cd frontend && npm run dev
```

### Debug Mode
For development debugging, you can still start applications individually in separate terminals if needed.

---

## 🆘 Support

If you encounter issues with the application management system:

1. Check this guide for troubleshooting steps
2. Run `npm run status:all` to diagnose issues
3. Use `npm run stop:all` to clean up processes
4. Restart with `npm run start:all`

For application-specific issues, refer to the individual application documentation in their respective directories.
