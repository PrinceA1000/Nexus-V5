import chalk from 'chalk';
import cliProgress from 'cli-progress';

export class TUI {
  constructor() {
    this.multibar = new cliProgress.MultiBar({
      format: chalk.cyan('{bar}') + ' | {percentage}% | {label}',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
      clearOnComplete: true
    });

    this.bars = {};
    this.bars['proxy'] = this.multibar.create(100, 0, { label: 'Proxy rotator' });
    this.bars['load'] = this.multibar.create(100, 0, { label: 'Load time' });
    this.bars['success'] = this.multibar.create(100, 0, { label: 'Success rate' });
    this.bars['status'] = this.multibar.create(100, 0, { label: 'Status' });

    this.lines = [];
    console.clear();
  }

  start() {
    process.stdout.write(chalk.yellow('🔱 Crown Nexus Browser Engine v5.0\n'));
    process.stdout.write(chalk.dim('─'.repeat(40)) + '\n');
  }

  updateStats(stats) {
    // Update bar values with real-time stats
    if (stats.loadTime) {
      const val = Math.min(parseInt(stats.loadTime), 100);
      this.bars['load'].update(val, { label: 'Load time: ' + stats.loadTime });
    }
    if (stats.successRate) {
      const val = parseFloat(stats.successRate) || 0;
      this.bars['success'].update(Math.min(val * 100, 100), { label: 'Success: ' + stats.successRate });
    }
    if (stats.proxy) {
      this.bars['proxy'].update(100, { label: 'Active Proxy: ' + stats.proxy });
    }
    if (stats.status) {
      this.bars['status'].update(100, { label: 'Status: ' + stats.status });
    }

    // Additional real-time info
    if (stats.lastProxy) {
      process.stdout.write(chalk.gray('Last proxy: ' + stats.lastProxy) + '\n');
    }
  }

  async stop() {
    this.multibar.stop();
    process.stdout.write(chalk.white('\n✓ Crown Nexus session finished\n'));
  }
}