import React, { createContext, useContext, useEffect, useState } from "react";
import { useNativeCurrencyPrice } from "./scaffold-eth";
import { useWebSocket } from "./useWebSocket";
import {
  ClientRequest,
  HodlInvoiceResponse,
  InitiationResponse,
  InvoiceResponse,
  ServerStatus,
} from "@lightning-evm-bridge/shared";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { HashLock } from "~~/types/utils";

// Define the types for your historical transactions and context
export type HistoricalTransaction = {
  status: "PENDING" | "FAILED" | "COMPLETED" | "REFUNDED" | "RELAYED" | "CACHED";
  date: string;
  amount: number;
  contractId: string;
  txHash: string;
  hashLockTimestamp: number;
  lnInvoice: string;
  userAddress: string;
  transactionType: "RECEIVED" | "SENT";
};

export type LightningAppContextType = {
  transactions: HistoricalTransaction[];
  sendMessage: (message: ClientRequest) => void;
  reconnect: () => void;
  isWebSocketConnected: boolean;
  data: InvoiceResponse | null;
  price: number;
  lspStatus: ServerStatus;
  lnInitationResponse: InitiationResponse | null;
  hodlInvoiceResponse: HodlInvoiceResponse | null;
  signerActive: boolean;
  hashLock: HashLock | null;
  setHashLock: (hashLock: HashLock) => void;
  receiveContractId: string;
};

// Create the context
const HistoricalTransactionsContext = createContext<LightningAppContextType | undefined>(undefined);

// Default values for context to avoid hydration issues
const defaultContextValues: LightningAppContextType = {
  transactions: [],
  sendMessage: (_message: ClientRequest) => {
    console.warn("WebSocket not initialized yet");
  },
  reconnect: () => {
    console.warn("WebSocket not initialized yet");
  },
  isWebSocketConnected: false,
  data: null,
  price: 0,
  lspStatus: ServerStatus.INACTIVE,
  lnInitationResponse: null,
  hodlInvoiceResponse: null,
  signerActive: false,
  hashLock: null,
  setHashLock: (_hashLock: HashLock) => {
    console.warn("Provider not initialized yet");
  },
  receiveContractId: "",
};

// Provider component
export const LightningProvider = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  const price = useNativeCurrencyPrice();
  const [hashLock, setHashLock] = useState<HashLock | null>(null);
  const [transactions, setTransactionsState] = useState<HistoricalTransaction[]>([]);

  // Only initialize WebSocket on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    sendMessage,
    isWebSocketConnected,
    data,
    reconnect,
    status,
    lnInitationResponse,
    receiveContractId,
    hodlInvoiceResponse,
    signerActive,
  } = useWebSocket(mounted ? process.env.WEBSOCKET_URL ?? "ws://localhost:3003" : "");

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <HistoricalTransactionsContext.Provider value={defaultContextValues}>
        {children}
      </HistoricalTransactionsContext.Provider>
    );
  }

  return (
    <HistoricalTransactionsContext.Provider
      value={{
        transactions,
        data,
        sendMessage,
        isWebSocketConnected,
        price,
        reconnect,
        lspStatus: status,
        lnInitationResponse,
        hodlInvoiceResponse,
        signerActive,
        hashLock,
        setHashLock,
        receiveContractId,
      }}
    >
      {children}
      <ToastContainer position="top-center" />
    </HistoricalTransactionsContext.Provider>
  );
};

// Custom hook for using the context
export const useLightningApp = () => {
  const context = useContext(HistoricalTransactionsContext);
  if (context === undefined) {
    throw new Error("useLightningApp must be used within a HistoricalTransactionsProvider");
  }
  return context;
};
