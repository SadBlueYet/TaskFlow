/**
 * Environment-aware logging utility
 * Logs are only shown in development mode, except for errors and warnings
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log general information (dev only)
   */
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },

  /**
   * Log informational messages (dev only)
   */
  info: (...args: any[]) => {
    if (isDev) console.info(...args);
  },

  /**
   * Log warnings (always shown)
   */
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  /**
   * Log errors (always shown)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Log debug information (dev only)
   */
  debug: (...args: any[]) => {
    if (isDev) console.debug(...args);
  },

  /**
   * Start a collapsible group (dev only)
   */
  group: (label: string) => {
    if (isDev) console.group(label);
  },

  /**
   * End a collapsible group (dev only)
   */
  groupEnd: () => {
    if (isDev) console.groupEnd();
  },

  /**
   * Log a table (dev only)
   */
  table: (data: any) => {
    if (isDev) console.table(data);
  }
};
