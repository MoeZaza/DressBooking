#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const pidFile = join(rootDir, '.bookdress-pids.json');

// Application configurations
const apps = [
  {
    name: 'Frontend',
    port: 3000,
    healthPath: '/',
    icon: '🌐',
    color: 'magenta'
  },
  {
    name: 'Backend',
    port: 3001,
    healthPath: '/',
    icon: '🔧',
    color: 'blue'
  },
  {
    name: 'API',
    port: 4002,
    healthPath: '/api/health',
    icon: '📡',
    color: 'green'
  }
];

// Check if process is running by PID
function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

// Check if port is in use
function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      method: 'GET',
      timeout: 2000
    }, (res) => {
      resolve({ 
        status: 'responding', 
        statusCode: res.statusCode,
        message: `HTTP ${res.statusCode}`
      });
    });

    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        resolve({ 
          status: 'port_closed', 
          message: 'Port not in use'
        });
      } else if (error.code === 'ETIMEDOUT') {
        resolve({ 
          status: 'timeout', 
          message: 'Connection timeout'
        });
      } else {
        resolve({ 
          status: 'error', 
          message: error.message
        });
      }
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ 
        status: 'timeout', 
        message: 'Connection timeout'
      });
    });

    req.end();
  });
}

// Get system information
function getSystemInfo() {
  const os = process.platform;
  const arch = process.arch;
  const nodeVersion = process.version;
  const uptime = process.uptime();
  
  return {
    platform: os,
    architecture: arch,
    nodeVersion,
    uptime: Math.floor(uptime)
  };
}

// Check application status
async function checkStatus() {
  console.log(chalk.cyan.bold('\n📊 BookDress - Application Status 📊'));
  console.log(chalk.cyan('='.repeat(45)));
  
  const systemInfo = getSystemInfo();
  console.log(chalk.gray(`\n💻 System: ${systemInfo.platform} ${systemInfo.architecture}`));
  console.log(chalk.gray(`🟢 Node.js: ${systemInfo.nodeVersion}`));
  console.log(chalk.gray(`⏱️  Uptime: ${systemInfo.uptime}s`));

  // Check saved PIDs
  let savedPids = {};
  if (existsSync(pidFile)) {
    try {
      savedPids = JSON.parse(readFileSync(pidFile, 'utf8'));
      console.log(chalk.green('\n✅ Found saved process information'));
    } catch (error) {
      console.log(chalk.yellow('\n⚠️  Could not read saved process information'));
    }
  } else {
    console.log(chalk.yellow('\n⚠️  No saved process information found'));
  }

  console.log(chalk.cyan('\n🔍 Checking Application Status:'));
  console.log(chalk.cyan('-'.repeat(40)));

  let runningCount = 0;
  let totalCount = apps.length;

  for (const app of apps) {
    const savedPid = savedPids[app.name];
    let pidStatus = 'unknown';
    let pidMessage = '';

    // Check PID status
    if (savedPid) {
      if (isProcessRunning(savedPid)) {
        pidStatus = 'running';
        pidMessage = `PID: ${savedPid}`;
      } else {
        pidStatus = 'stopped';
        pidMessage = `PID: ${savedPid} (not running)`;
      }
    } else {
      pidStatus = 'no_pid';
      pidMessage = 'No saved PID';
    }

    // Check port status
    const portStatus = await checkPort(app.port);
    
    // Determine overall status
    let overallStatus = 'stopped';
    let statusColor = 'red';
    let statusIcon = '❌';
    
    if (portStatus.status === 'responding') {
      overallStatus = 'running';
      statusColor = 'green';
      statusIcon = '✅';
      runningCount++;
    } else if (portStatus.status === 'timeout') {
      overallStatus = 'starting';
      statusColor = 'yellow';
      statusIcon = '⏳';
    }

    // Display status
    console.log(chalk[statusColor](`\n${statusIcon} ${app.icon} ${app.name}`));
    console.log(chalk.white(`   Port: ${app.port} - ${portStatus.message}`));
    console.log(chalk.gray(`   Process: ${pidMessage}`));
    console.log(chalk.gray(`   URL: http://localhost:${app.port}${app.healthPath}`));
  }

  // Summary
  console.log(chalk.cyan('\n📈 Summary:'));
  console.log(chalk.cyan('-'.repeat(15)));
  
  if (runningCount === totalCount) {
    console.log(chalk.green(`✅ All applications running (${runningCount}/${totalCount})`));
  } else if (runningCount > 0) {
    console.log(chalk.yellow(`⚠️  Partially running (${runningCount}/${totalCount})`));
  } else {
    console.log(chalk.red(`❌ No applications running (${runningCount}/${totalCount})`));
  }

  // Environment status
  console.log(chalk.cyan('\n🔧 Environment Status:'));
  console.log(chalk.cyan('-'.repeat(20)));
  
  if (existsSync(join(rootDir, 'api/.env.local'))) {
    console.log(chalk.green('✅ Secure API environment (api/.env.local)'));
  } else if (existsSync(join(rootDir, 'api/.env'))) {
    console.log(chalk.yellow('⚠️  Basic API environment (api/.env)'));
  } else {
    console.log(chalk.red('❌ No API environment file'));
  }

  if (existsSync(join(rootDir, 'backend/.env'))) {
    console.log(chalk.green('✅ Backend environment configured'));
  } else {
    console.log(chalk.yellow('⚠️  Backend environment not found'));
  }

  if (existsSync(join(rootDir, 'frontend/.env'))) {
    console.log(chalk.green('✅ Frontend environment configured'));
  } else {
    console.log(chalk.yellow('⚠️  Frontend environment not found'));
  }

  // Management commands
  console.log(chalk.cyan('\n🛠️  Management Commands:'));
  console.log(chalk.cyan('-'.repeat(22)));
  console.log(chalk.white('   npm run start:all   - Start all applications'));
  console.log(chalk.white('   npm run stop:all    - Stop all applications'));
  console.log(chalk.white('   npm run restart:all - Restart all applications'));
  console.log(chalk.white('   npm run status:all  - Show this status'));

  // Recommendations
  if (runningCount < totalCount) {
    console.log(chalk.yellow('\n💡 Recommendations:'));
    console.log(chalk.yellow('-'.repeat(17)));
    if (runningCount === 0) {
      console.log(chalk.white('   Run "npm run start:all" to start all applications'));
    } else {
      console.log(chalk.white('   Run "npm run restart:all" to restart all applications'));
      console.log(chalk.white('   Or check individual application logs for issues'));
    }
  }

  console.log(''); // Empty line at the end
}

checkStatus().catch(console.error);
