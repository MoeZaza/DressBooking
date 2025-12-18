#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const pidFile = join(rootDir, '.bookdress-pids.json');

// Application configurations
const apps = [
  {
    name: 'API',
    dir: 'api',
    command: 'npm',
    args: ['run', 'dev'],
    port: 4002,
    color: 'green',
    icon: '📡'
  },
  {
    name: 'Backend',
    dir: 'backend', 
    command: 'npm',
    args: ['run', 'dev'],
    port: 3001,
    color: 'blue',
    icon: '🔧'
  },
  {
    name: 'Frontend',
    dir: 'frontend',
    command: 'npm',
    args: ['run', 'dev'],
    port: 3000,
    color: 'magenta',
    icon: '🌐'
  }
];

// Check if applications are already running
function checkRunningApps() {
  if (!existsSync(pidFile)) {
    return [];
  }
  
  try {
    const pids = JSON.parse(readFileSync(pidFile, 'utf8'));
    const running = [];
    
    for (const [name, pid] of Object.entries(pids)) {
      try {
        // Check if process is still running
        process.kill(pid, 0);
        running.push(name);
      } catch (e) {
        // Process not running
      }
    }
    
    return running;
  } catch (e) {
    return [];
  }
}

// Start all applications
async function startAll() {
  console.log(chalk.green.bold('\n👗 BookDress - Starting All Applications 👗'));
  console.log(chalk.green('='.repeat(50)));
  
  const runningApps = checkRunningApps();
  if (runningApps.length > 0) {
    console.log(chalk.yellow(`\n⚠️  Some applications are already running: ${runningApps.join(', ')}`));
    console.log(chalk.yellow('Use "npm run restart:all" to restart all applications'));
    console.log(chalk.yellow('Use "npm run stop:all" to stop running applications first'));
    return;
  }

  // Check environment files
  console.log(chalk.cyan('\n🔍 Checking environment configuration...'));
  
  if (existsSync(join(rootDir, 'api/.env.local'))) {
    console.log(chalk.green('✅ Using secure api/.env.local (credentials protected)'));
  } else if (existsSync(join(rootDir, 'api/.env'))) {
    console.log(chalk.yellow('⚠️  Using api/.env - consider creating api/.env.local for secure credentials'));
  } else {
    console.log(chalk.red('❌ No API environment file found'));
    return;
  }

  const pids = {};
  const startPromises = [];

  for (const app of apps) {
    const promise = new Promise((resolve, reject) => {
      console.log(chalk[app.color](`\n${app.icon} Starting ${app.name} (Port ${app.port})...`));
      
      const appDir = join(rootDir, app.dir);
      if (!existsSync(appDir)) {
        console.log(chalk.red(`❌ Directory ${app.dir} not found`));
        reject(new Error(`Directory ${app.dir} not found`));
        return;
      }

      const child = spawn(app.command, app.args, {
        cwd: appDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        shell: process.platform === 'win32'
      });

      pids[app.name] = child.pid;

      child.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.log(chalk[app.color](`[${app.name}] ${output}`));
        }
      });

      child.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output && !output.includes('ExperimentalWarning')) {
          console.log(chalk.red(`[${app.name}] ${output}`));
        }
      });

      child.on('error', (error) => {
        console.log(chalk.red(`❌ Failed to start ${app.name}: ${error.message}`));
        reject(error);
      });

      // Consider the app started after a short delay
      setTimeout(() => {
        console.log(chalk.green(`✅ ${app.name} started successfully`));
        resolve();
      }, 3000);
    });

    startPromises.push(promise);
    
    // Stagger the starts to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Save PIDs to file
  writeFileSync(pidFile, JSON.stringify(pids, null, 2));

  try {
    await Promise.all(startPromises);
    
    console.log(chalk.green.bold('\n🎉 All Applications Started Successfully! 🎉'));
    console.log(chalk.green('='.repeat(50)));
    console.log(chalk.cyan('\n📱 Application URLs:'));
    console.log(chalk.white('   Frontend:  http://localhost:3000'));
    console.log(chalk.white('   Backend:   http://localhost:3001'));
    console.log(chalk.white('   API:       http://localhost:4002'));
    
    console.log(chalk.cyan('\n🛠️  Management Commands:'));
    console.log(chalk.white('   npm run stop:all    - Stop all applications'));
    console.log(chalk.white('   npm run restart:all - Restart all applications'));
    console.log(chalk.white('   npm run status:all  - Check application status'));
    
    console.log(chalk.green('\n✨ Applications are running in the background'));
    console.log(chalk.gray('Press Ctrl+C to stop this monitoring process (apps will continue running)'));
    
  } catch (error) {
    console.log(chalk.red('\n❌ Some applications failed to start'));
    console.log(chalk.yellow('Use "npm run status:all" to check which applications are running'));
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n🛑 Monitoring stopped. Applications continue running in background.'));
  console.log(chalk.cyan('Use "npm run stop:all" to stop all applications'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n\n🛑 Monitoring stopped. Applications continue running in background.'));
  process.exit(0);
});

startAll().catch(console.error);
