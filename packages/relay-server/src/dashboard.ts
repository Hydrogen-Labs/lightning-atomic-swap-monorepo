import * as blessed from "blessed";
import * as contrib from "blessed-contrib";
import { ethers } from "ethers";
import { logger } from "./logger";
import { DashboardOptions, LogEntry, RelayServerState } from "./types";

export class RelayServerDashboard {
  private screen: blessed.Widgets.Screen;
  private grid: contrib.grid;
  private serverStatusBox: blessed.Widgets.BoxElement;
  private pendingRelaysTable: contrib.Widgets.TableElement;
  private recentRelaysTable: contrib.Widgets.TableElement;
  private logBox: contrib.Widgets.LogElement;
  private updateInterval: number;
  private intervalId?: NodeJS.Timeout;
  private maxLogs: number;
  private logs: LogEntry[] = [];
  private selectedId: string | null = null;

  constructor(private serverState: RelayServerState, options: DashboardOptions = {}) {
    this.updateInterval = options.updateInterval || 1000;
    this.maxLogs = options.maxLogs || 100;

    // Create blessed screen
    this.screen = blessed.screen({
      smartCSR: true,
      title: "HTLC Relay Server Dashboard",
    });

    // Create a grid layout
    this.grid = new contrib.grid({ rows: 12, cols: 12, screen: this.screen });

    // Server status widget
    this.serverStatusBox = this.grid.set(0, 0, 2, 12, blessed.box, {
      label: "Server Status",
      tags: true,
      border: { type: "line" },
      style: {
        fg: "white",
        border: { fg: "cyan" },
      },
    });

    // Pending relays table
    this.pendingRelaysTable = this.grid.set(2, 0, 4, 12, contrib.table, {
      label: "Pending Relays",
      keys: true,
      interactive: true,
      columnSpacing: 2,
      columnWidth: [36, 12, 18],
      fg: "white",
      border: { type: "line", fg: "cyan" },
      mouse: true,
    });

    // Recent relays table
    this.recentRelaysTable = this.grid.set(6, 0, 3, 12, contrib.table, {
      label: "Recent Relays",
      keys: true,
      interactive: true,
      columnSpacing: 2,
      columnWidth: [36, 15, 24],
      fg: "white",
      border: { type: "line", fg: "cyan" },
      mouse: true,
    });

    // Log box
    this.logBox = this.grid.set(9, 0, 3, 12, contrib.log, {
      label: "Server Logs",
      fg: "green",
      selectedFg: "green",
      tags: true,
      border: { type: "line", fg: "cyan" },
      mouse: true,
      keys: true,
      vi: true,
      scrollable: true,
      scrollbar: {
        ch: " ",
        track: {
          bg: "cyan",
        },
        style: {
          inverse: true,
        },
      },
      style: {
        fg: "green",
        border: { fg: "cyan" },
      },
    });

    // Setup click handlers
    this.setupClickHandlers();

    // Key bindings
    this.screen.key(["escape", "q", "C-c"], () => {
      this.stop();
      process.exit(0);
    });

    this.screen.key("r", () => this.updateDashboard());
    this.screen.key("c", () => this.clearFilter());

    // Initialize logger with dashboard reference
    logger.setDashboard(this);

    this.addLogEntry("Dashboard initialized", "info");
  }

  private setupClickHandlers(): void {
    // Handle clicks on recent relays table
    this.recentRelaysTable.on("click", (data: any) => {
      if (data?.row >= 0) {
        const request = this.serverState.recentRequests[data.row];
        if (request) {
          this.filterLogsByRelatedId(request.contractId);
        }
      }
    });

    // Handle clicks on pending relays
    this.pendingRelaysTable.on("click", (data: any) => {
      if (data?.row >= 0) {
        const contractId = this.serverState.pendingContracts[data.row];
        if (contractId) {
          this.filterLogsByRelatedId(contractId);
        }
      }
    });
  }

  private filterLogsByRelatedId(id: string): void {
    this.selectedId = id;
    this.logBox.setLabel(`Server Logs (Filtered by ID: ${id})`);
    this.logBox.setContent("");

    const filteredLogs = this.logs.filter(log => {
      // Check both the relatedId and message content
      return log.relatedId === id || log.message.includes(id);
    });

    if (filteredLogs.length === 0) {
      this.logBox.log(`No logs found for ID: ${id}`);
    } else {
      filteredLogs.forEach(log => {
        this.logBox.log(`{gray-fg}[${log.timestamp}]{/gray-fg} ${this.getLogLevelColor(log.level)}${log.message}{/}`);
      });
    }

    this.screen.render();
  }

  private getLogLevelColor(level: string): string {
    switch (level) {
      case "error":
        return "{red-fg}";
      case "warn":
        return "{yellow-fg}";
      case "info":
        return "{green-fg}";
      case "debug":
        return "{blue-fg}";
      default:
        return "{white-fg}";
    }
  }

  private clearFilter(): void {
    this.selectedId = null;
    this.logBox.setLabel("Server Logs");
    this.logBox.setContent("");

    this.logs.slice(-this.maxLogs).forEach(log => {
      this.logBox.log(`{gray-fg}[${log.timestamp}]{/gray-fg} ${this.getLogLevelColor(log.level)}${log.message}{/}`);
    });

    this.screen.render();
  }

  private async updateServerStatus(): Promise<void> {
    const { serverAddress, chainId, rpcUrl, provider } = this.serverState;

    try {
      // Get native balance
      const nativeBalance = await provider.getBalance(serverAddress);
      const formattedNativeBalance = ethers.formatEther(nativeBalance);

      // Add a controls section
      const controlsInfo =
        "{white-fg}Controls:{/white-fg}\n" +
        " • {cyan-fg}q{/cyan-fg} or {cyan-fg}Ctrl+C{/cyan-fg}: Quit\n" +
        " • {cyan-fg}r{/cyan-fg}: Refresh dashboard\n" +
        " • {cyan-fg}c{/cyan-fg}: Clear filters\n" +
        " • {cyan-fg}Click{/cyan-fg} on items to filter logs";

      this.serverStatusBox.setContent(
        `Server Address: {yellow-fg}${serverAddress}{/yellow-fg}\n` +
          `Native Balance: {cyan-fg}${formattedNativeBalance} ETH{/cyan-fg}\n\n` +
          controlsInfo,
      );
    } catch (error) {
      console.error("Error updating balances:", error);
      this.serverStatusBox.setContent(
        `Server Address: {yellow-fg}${serverAddress}{/yellow-fg}\n` +
          `Error fetching balances: {red-fg}${error.message}{/red-fg}`,
      );
    }
  }

  private updatePendingRelaysTable(): void {
    const pendingRelaysData = {
      headers: ["Contract ID", "Amount", "Status"],
      data: [] as string[][],
    };

    // Map each pending contract to get its details
    for (const contractId of this.serverState.pendingContracts) {
      const details = this.serverState.contractDetails.get(contractId);
      const shortContractId = contractId.length > 34 ? contractId.substring(0, 31) + "..." : contractId;

      if (details) {
        pendingRelaysData.data.push([shortContractId, details.amount.toString(), "{yellow-fg}Pending Relay{/}"]);
      } else {
        pendingRelaysData.data.push([shortContractId, "Unknown", "{yellow-fg}Pending Relay{/}"]);
      }
    }

    if (pendingRelaysData.data.length === 0) {
      pendingRelaysData.data = [["No pending relays", "", ""]];
    }

    this.pendingRelaysTable.setData(pendingRelaysData);
  }

  private updateRecentRelaysTable(): void {
    const recentRelaysData = {
      headers: ["Contract ID", "Amount", "Preimage (short)"],
      data: [] as string[][],
    };

    // Get data from recent requests and contract details
    for (const request of this.serverState.recentRequests) {
      const details = this.serverState.contractDetails.get(request.contractId);
      const shortContractId =
        request.contractId.length > 34 ? request.contractId.substring(0, 31) + "..." : request.contractId;
      const shortPreimage = request.preimage ? request.preimage.substring(0, 10) + "..." : "N/A";

      // Only include completed relays (withdrawn = true)
      if (details && details.withdrawn) {
        recentRelaysData.data.push([shortContractId, details.amount.toString(), shortPreimage]);
      }
    }

    if (recentRelaysData.data.length === 0) {
      recentRelaysData.data = [["No completed relays", "", ""]];
    }

    this.recentRelaysTable.setData(recentRelaysData);
  }

  addLogEntry(message: string, level: "info" | "error" | "warn" | "debug", relatedId?: string): void {
    try {
      const timestamp = new Date().toISOString();
      const logEntry: LogEntry = {
        timestamp,
        message,
        relatedId,
        level,
      };

      this.logs.push(logEntry);

      // Trim logs if exceeding maxLogs
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }

      // Only show the log if it matches the current filter or if no filter is active
      if (
        !this.selectedId ||
        (logEntry.relatedId && logEntry.relatedId === this.selectedId) ||
        (this.selectedId && logEntry.message.includes(this.selectedId))
      ) {
        this.logBox.log(`{gray-fg}[${timestamp}]{/gray-fg} ${this.getLogLevelColor(level)}${message}{/}`);
        this.logBox.setScrollPerc(100);
      }

      this.logBox.render();
    } catch (error) {
      console.error("Error adding log entry to dashboard:", error);
    }
  }

  async updateDashboard(): Promise<void> {
    try {
      await this.updateServerStatus();
      this.updatePendingRelaysTable();
      this.updateRecentRelaysTable();

      // Ensure logBox stays on top
      this.logBox.setFront();

      // Render the entire screen
      this.screen.render();
    } catch (error) {
      console.error("Error updating dashboard:", error);
    }
  }

  start(): void {
    try {
      // Initial render
      this.updateDashboard().catch(error => {
        logger.error("Error in initial dashboard update:", error);
      });

      // Setup update interval
      this.intervalId = setInterval(() => {
        this.updateDashboard().catch(error => {
          logger.error("Error in dashboard update interval:", error);
        });
      }, this.updateInterval);

      // Install the logger to override console methods
      logger.install();

      // Render the screen
      this.screen.render();
    } catch (error) {
      console.error("Error starting dashboard:", error);
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Restore original console methods
    logger.uninstall();

    this.screen.destroy();
  }
}
