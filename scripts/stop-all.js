#!/usr/bin/env node

import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const pidFile = join(rootDir, '.bookdress-pids.json');

// Kill process by PID (cross-platform)
function killProcess(pid, signal = 'SIGTERM') {
  try {
    if (process.platform === 'win32') {
      // Windows
      spawn('taskkill', ['/pid', pid.toString(), '/f', '/t'], { stdio: 'ignore' });
    } else {
      // Unix-like systems
      process.kill(pid, signal);
    }
    return true;
  } catch (error) {
    return false;
  }
}

// Check if process is running
function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

// Kill processes by name (fallback method)
function killProcessesByName(processNames) {
  if (process.platform === 'win32') {
    processNames.forEach(name => {
      spawn('taskkill', ['/im', name, '/f', '/t'], { stdio: 'ignore' });
    });
  } else {
    processNames.forEach(name => {
      spawn('pkill', ['-f', name], { stdio: 'ignore' });
    });
  }
}

// Stop all applications
async function stopAll() {
  console.log(chalk.red.bold('\n🛑 BookDress - Stopping All Applications 🛑'));
  console.log(chalk.red('='.repeat(50)));

  let stoppedCount = 0;
  let totalCount = 0;

  // Method 1: Stop using saved PIDs
  if (existsSync(pidFile)) {
    try {
      const pids = JSON.parse(readFileSync(pidFile, 'utf8'));
      
      console.log(chalk.cyan('\n🔍 Stopping applications using saved PIDs...'));
      
      for (const [appName, pid] of Object.entries(pids)) {
        totalCount++;
        console.log(chalk.yellow(`Stopping ${appName} (PID: ${pid})...`));
        
        if (isProcessRunning(pid)) {
          const killed = killProcess(pid);
          if (killed) {
            console.log(chalk.green(`✅ ${appName} stopped successfully`));
            stoppedCount++;
          } else {
            console.log(chalk.red(`❌ Failed to stop ${appName}`));
          }
        } else {
          console.log(chalk.gray(`⚪ ${appName} was not running`));
        }
      }
      
      // Clean up PID file
      unlinkSync(pidFile);
      console.log(chalk.gray('🗑️  Cleaned up PID file'));
      
    } catch (error) {
      console.log(chalk.red(`❌ Error reading PID file: ${error.message}`));
    }
  }

  // Method 2: Fallback - kill by process name patterns
  console.log(chalk.cyan('\n🔍 Stopping any remaining Node.js processes...'));
  
  const processPatterns = [
    'node.*api.*dev',
    'node.*backend.*dev', 
    'node.*frontend.*dev',
    'npm.*run.*dev'
  ];
  
  if (process.platform === 'win32') {
    // Windows - kill node processes running dev scripts

    // Kill node processes that might be running our apps
    spawn('taskkill', ['/f', '/im', 'node.exe'], { stdio: 'ignore' });
    spawn('taskkill', ['/f', '/im', 'npm.cmd'], { stdio: 'ignore' });

    console.log(chalk.yellow('⚠️  Terminated all Node.js and npm processes (Windows)'));
  } else {
    // Unix-like systems

    processPatterns.forEach(pattern => {
      spawn('pkill', ['-f', pattern], { stdio: 'ignore' });
    });

    console.log(chalk.yellow('⚠️  Terminated matching Node.js processes (Unix)'));
  }

  // Method 3: Kill processes on specific ports
  console.log(chalk.cyan('\n🔍 Freeing up application ports...'));
  
  const ports = [3000, 3001, 4002];
  
  for (const port of ports) {
    try {
      if (process.platform === 'win32') {
        // Find and kill process using the port
        const netstat = spawn('netstat', ['-ano'], { stdio: ['ignore', 'pipe', 'ignore'] });

        netstat.stdout.on('data', (data) => {
          const lines = data.toString().split('\n');
          lines.forEach(line => {
            if (line.includes(`:${port} `) && line.includes('LISTENING')) {
              const parts = line.trim().split(/\s+/);
              const pid = parts[parts.length - 1];
              if (pid && !isNaN(pid)) {
                spawn('taskkill', ['/pid', pid, '/f'], { stdio: 'ignore' });
                console.log(chalk.green(`✅ Freed port ${port} (PID: ${pid})`));
              }
            }
          });
        });
      } else {
        spawn('lsof', ['-ti', `:${port}`], { stdio: ['ignore', 'pipe', 'ignore'] })
          .stdout.on('data', (data) => {
            const pids = data.toString().trim().split('\n');
            pids.forEach(pid => {
              if (pid && !isNaN(pid)) {
                spawn('kill', ['-9', pid], { stdio: 'ignore' });
                console.log(chalk.green(`✅ Freed port ${port} (PID: ${pid})`));
              }
            });
          });
      }
    } catch (error) {
      console.log(chalk.gray(`⚪ Port ${port} check failed: ${error.message}`));
    }
  }

  // Wait a moment for processes to terminate
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(chalk.red.bold('\n🏁 Stop Operation Complete'));
  console.log(chalk.red('='.repeat(30)));
  
  if (totalCount > 0) {
    console.log(chalk.green(`✅ Successfully stopped: ${stoppedCount}/${totalCount} tracked applications`));
  }
  
  console.log(chalk.yellow('⚠️  Additional cleanup performed for any remaining processes'));
  console.log(chalk.cyan('\n📱 Ports should now be available:'));
  console.log(chalk.white('   Port 3000 (Frontend)'));
  console.log(chalk.white('   Port 3001 (Backend)'));
  console.log(chalk.white('   Port 4002 (API)'));
  
  console.log(chalk.cyan('\n🚀 To start applications again:'));
  console.log(chalk.white('   npm run start:all'));
  console.log(chalk.white('   npm run status:all  (to check status)'));
}

stopAll().catch(console.error);
