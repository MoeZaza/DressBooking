/**
 * Error Monitoring System for Backend Admin Panel
 * Tracks and categorizes errors for immediate detection and fixing
 */

export interface ErrorReport {
  id: string;
  timestamp: Date;
  type: 'PERFORMANCE' | 'UI' | 'NETWORK' | 'CONSOLE' | 'CONTENT' | 'EXCEPTION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  page: string;
  description: string;
  userAgent?: string;
  url?: string;
  stackTrace?: string;
  fixed: boolean;
}

class ErrorMonitor {
  private errors: ErrorReport[] = [];
  private listeners: ((error: ErrorReport) => void)[] = [];

  // Add error to monitoring system
  addError(error: Omit<ErrorReport, 'id' | 'timestamp' | 'fixed'>): ErrorReport {
    const errorReport: ErrorReport = {
      ...error,
      id: this.generateId(),
      timestamp: new Date(),
      fixed: false
    };

    this.errors.push(errorReport);
    this.notifyListeners(errorReport);
    
    console.error(`🚨 [${errorReport.severity}] ${errorReport.type}: ${errorReport.description} on ${errorReport.page}`);
    
    return errorReport;
  }

  // Mark error as fixed
  markFixed(errorId: string): boolean {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.fixed = true;
      console.log(`✅ Fixed error: ${error.description}`);
      return true;
    }
    return false;
  }

  // Get all errors
  getAllErrors(): ErrorReport[] {
    return [...this.errors];
  }

  // Get unfixed errors
  getUnfixedErrors(): ErrorReport[] {
    return this.errors.filter(e => !e.fixed);
  }

  // Get errors by severity
  getErrorsBySeverity(severity: ErrorReport['severity']): ErrorReport[] {
    return this.errors.filter(e => e.severity === severity);
  }

  // Get errors by type
  getErrorsByType(type: ErrorReport['type']): ErrorReport[] {
    return this.errors.filter(e => e.type === type);
  }

  // Get errors by page
  getErrorsByPage(page: string): ErrorReport[] {
    return this.errors.filter(e => e.page === page);
  }

  // Get statistics
  getStats() {
    const total = this.errors.length;
    const fixed = this.errors.filter(e => e.fixed).length;
    const unfixed = total - fixed;
    
    const bySeverity = {
      critical: this.errors.filter(e => e.severity === 'CRITICAL').length,
      high: this.errors.filter(e => e.severity === 'HIGH').length,
      medium: this.errors.filter(e => e.severity === 'MEDIUM').length,
      low: this.errors.filter(e => e.severity === 'LOW').length
    };

    const byType = {
      performance: this.errors.filter(e => e.type === 'PERFORMANCE').length,
      ui: this.errors.filter(e => e.type === 'UI').length,
      network: this.errors.filter(e => e.type === 'NETWORK').length,
      console: this.errors.filter(e => e.type === 'CONSOLE').length,
      content: this.errors.filter(e => e.type === 'CONTENT').length,
      exception: this.errors.filter(e => e.type === 'EXCEPTION').length
    };

    return {
      total,
      fixed,
      unfixed,
      fixRate: total > 0 ? Math.round((fixed / total) * 100) : 0,
      bySeverity,
      byType
    };
  }

  // Add listener for real-time error notifications
  addListener(listener: (error: ErrorReport) => void): void {
    this.listeners.push(listener);
  }

  // Remove listener
  removeListener(listener: (error: ErrorReport) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Clear all errors
  clearErrors(): void {
    this.errors = [];
    console.log('🧹 Error monitor cleared');
  }

  // Generate report
  generateReport(): string {
    const stats = this.getStats();
    const unfixedErrors = this.getUnfixedErrors();
    
    let report = '\n📊 ERROR MONITORING REPORT\n';
    report += '='.repeat(50) + '\n';
    report += `📈 STATISTICS:\n`;
    report += `   Total Errors: ${stats.total}\n`;
    report += `   Fixed: ${stats.fixed} (${stats.fixRate}%)\n`;
    report += `   Unfixed: ${stats.unfixed}\n\n`;
    
    report += `🚨 BY SEVERITY:\n`;
    report += `   Critical: ${stats.bySeverity.critical}\n`;
    report += `   High: ${stats.bySeverity.high}\n`;
    report += `   Medium: ${stats.bySeverity.medium}\n`;
    report += `   Low: ${stats.bySeverity.low}\n\n`;
    
    report += `🔍 BY TYPE:\n`;
    report += `   Performance: ${stats.byType.performance}\n`;
    report += `   UI: ${stats.byType.ui}\n`;
    report += `   Network: ${stats.byType.network}\n`;
    report += `   Console: ${stats.byType.console}\n`;
    report += `   Content: ${stats.byType.content}\n`;
    report += `   Exception: ${stats.byType.exception}\n\n`;
    
    if (unfixedErrors.length > 0) {
      report += `❌ UNFIXED ERRORS (${unfixedErrors.length}):\n`;
      unfixedErrors.forEach((error, index) => {
        report += `   ${index + 1}. [${error.severity}] ${error.type}: ${error.description} (${error.page})\n`;
      });
    }
    
    return report;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private notifyListeners(error: ErrorReport): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error monitor listener:', err);
      }
    });
  }
}

// Global error monitor instance
export const errorMonitor = new ErrorMonitor();

// Helper functions for common error types
export const reportPerformanceIssue = (page: string, loadTime: number) => {
  return errorMonitor.addError({
    type: 'PERFORMANCE',
    severity: loadTime > 10000 ? 'CRITICAL' : loadTime > 5000 ? 'HIGH' : 'MEDIUM',
    page,
    description: `Slow page load: ${loadTime}ms`
  });
};

export const reportUIIssue = (page: string, description: string) => {
  return errorMonitor.addError({
    type: 'UI',
    severity: 'MEDIUM',
    page,
    description
  });
};

export const reportNetworkIssue = (page: string, url: string, status: number) => {
  return errorMonitor.addError({
    type: 'NETWORK',
    severity: status >= 500 ? 'HIGH' : 'MEDIUM',
    page,
    description: `Network error: ${status} ${url}`,
    url
  });
};

export const reportContentIssue = (page: string, description: string) => {
  return errorMonitor.addError({
    type: 'CONTENT',
    severity: 'HIGH',
    page,
    description
  });
};

export const reportConsoleError = (page: string, message: string) => {
  return errorMonitor.addError({
    type: 'CONSOLE',
    severity: 'MEDIUM',
    page,
    description: `Console error: ${message}`
  });
};

export const reportException = (page: string, error: Error) => {
  return errorMonitor.addError({
    type: 'EXCEPTION',
    severity: 'CRITICAL',
    page,
    description: error.message,
    stackTrace: error.stack
  });
};

export default errorMonitor;
