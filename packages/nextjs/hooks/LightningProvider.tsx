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
  recieveContractId: string;
};

// Create the context
const HistoricalTransactionsContext = createContext<LightningAppContextType | undefined>(undefined);

// Provider component
export const LightningProvider = ({ children }: { children: React.ReactNode }) => {
  const price = useNativeCurrencyPrice();
  const [hashLock, setHashLock] = useState<HashLock | null>(null);
  const [transactions, setTransactionsState] = useState<HistoricalTransaction[]>([]);

  const {
    sendMessage,
    isWebSocketConnected,
    data,
    reconnect,
    status,
    lnInitationResponse,
    recieveContractId,
    hodlInvoiceResponse,
    signerActive,
  } = useWebSocket(process.env.WEBSOCKET_URL ?? "ws://localhost:3003");

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
        recieveContractId,
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
