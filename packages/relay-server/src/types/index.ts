import { ethers } from "ethers";
import { ContractDetails, RelayRequest, RelayResponse } from "../../../shared";

export interface RelayServerState {
  serverAddress: string;
  chainId: string;
  rpcUrl: string;
  htlcContract: ethers.Contract;
  contractDetails: Map<string, ContractDetails>;
  recentRequests: RelayRequest[];
  recentResponses: RelayResponse[];
  pendingContracts: string[];
  provider: ethers.JsonRpcProvider;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  relatedId?: string;
  level: "info" | "error" | "warn" | "debug";
}

export interface DashboardOptions {
  updateInterval?: number;
  maxLogs?: number;
}
