import React, { useEffect, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { Transaction } from "@lightning-evm-bridge/shared";
import "react-toastify/dist/ReactToastify.css";
import { useWalletClient } from "wagmi";
import { useWaitForTransaction } from "wagmi";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { notification } from "~~/utils/scaffold-eth";

const GET_USER_TRANSACTIONS = gql`
  query GetUserTransactions($address: String!) {
    sentTransactions: HashedTimeLock_LogHTLCNew(where: { sender: { _eq: $address } }) {
      ...HTLCFields
    }
    receivedTransactions: HashedTimeLock_LogHTLCNew(where: { receiver: { _eq: $address } }) {
      ...HTLCFields
    }
    withdrawTransactions: HashedTimeLock_LogHTLCWithdraw {
      id
      contractId
      txHash
    }
    refundTransactions: HashedTimeLock_LogHTLCRefund {
      id
      contractId
      txHash
    }
  }

  fragment HTLCFields on HashedTimeLock_LogHTLCNew {
    id
    contractId
    sender
    receiver
    amount
    hashlock
    timelock
    timestamp
    txHash
  }
`;

type HistoryTableProps = {
  account: string | undefined;
  isWebSocketConnected: boolean;
};

export const HistoryTable = ({ account, isWebSocketConnected }: HistoryTableProps) => {
  const { setDbUpdated, dbUpdated } = useGlobalState();
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const { data: walletClient } = useWalletClient();
  const [transactionsHT, setTransactionsHT] = useState<Transaction[]>([]);
  const [showReclaimableOnly, setShowReclaimableOnly] = useState<boolean>(false);
  const [refundTxHash, setRefundTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [refundingTransactionId, setRefundingTransactionId] = useState<string | null>(null);
  const [pendingToastId, setPendingToastId] = useState<string | null>(null);
  const { data: htlcContract } = useScaffoldContract({
    contractName: "HashedTimelock",
    walletClient,
  });

  const normalizedAddress = account ? account.toLowerCase() : "";

  // Clear transactions when account is disconnected
  useEffect(() => {
    if (!account) {
      setTransactionsHT([]);
      setExpandedRow(null);
    }
  }, [account]);

  const { loading, error, data, refetch } = useQuery(GET_USER_TRANSACTIONS, {
    variables: { address: normalizedAddress },
    skip: !normalizedAddress || !isWebSocketConnected,
  });

  const getTransactionStatus = (contractId: string, data: any) => {
    // Get all contract IDs from sent and received transactions
    const relevantContractIds = new Set([
      ...data.sentTransactions.map((tx: any) => tx.contractId),
      ...data.receivedTransactions.map((tx: any) => tx.contractId),
    ]);

    // Only check status if this contract is in our relevant set
    if (!relevantContractIds.has(contractId)) {
      return "pending";
    }

    const isWithdrawn = data.withdrawTransactions.some((w: any) => w.contractId === contractId);
    const isRefunded = data.refundTransactions.some((r: any) => r.contractId === contractId);

    if (isWithdrawn) return "completed";
    if (isRefunded) return "refunded";

    // Find the transaction to check its timelock
    const transaction = [...data.sentTransactions, ...data.receivedTransactions].find(
      (tx: any) => tx.contractId === contractId,
    );

    if (transaction && Number(transaction.timelock) < Date.now() / 1000) {
      return "expired";
    }

    return "pending";
  };

  // Helper function to find related transaction hashes
  const findRelatedTransactionHash = (contractId: string, data: any) => {
    // Find withdraw transaction
    const withdrawTx = data?.withdrawTransactions?.find((tx: any) => tx.contractId === contractId);
    // Find refund transaction
    const refundTx = data?.refundTransactions?.find((tx: any) => tx.contractId === contractId);

    return {
      withdrawTxHash: withdrawTx?.txHash,
      refundTxHash: refundTx?.txHash,
    };
  };

  useEffect(() => {
    if (data) {
      // Transform the GraphQL data into the Transaction format
      const allTransactions = [...data.sentTransactions, ...data.receivedTransactions];
      const transformedTransactions = allTransactions.map((htlc: any) => {
        const status = getTransactionStatus(htlc.contractId, data);
        const relatedTxHashes = findRelatedTransactionHash(htlc.contractId, data);
        const transactionType: "RECEIVED" | "SENT" =
          htlc.sender.toLowerCase() === normalizedAddress ? "SENT" : "RECEIVED";
        return {
          status: status.toUpperCase() as
            | "PENDING"
            | "FAILED"
            | "COMPLETED"
            | "REFUNDED"
            | "RELAYED"
            | "CACHED"
            | "EXPIRED",
          date: new Date(Number(htlc.timestamp) * 1000).toISOString(),
          amount: Number(htlc.amount) / 10_000_000_000,
          txHash: htlc.txHash || htlc.id,
          contractId: htlc.contractId,
          hashLockTimestamp: Number(htlc.timelock),
          lnInvoice: "", // This will be populated from somewhere else
          userAddress: htlc.sender,
          transactionType,
          withdrawTxHash: relatedTxHashes.withdrawTxHash,
          refundTxHash: relatedTxHashes.refundTxHash,
        };
      });

      setTransactionsHT(transformedTransactions);
    }
  }, [data, normalizedAddress]);

  // Refetch transactions when dbUpdated changes
  useEffect(() => {
    if (dbUpdated) {
      refetch();
      setDbUpdated(false);
    }
  }, [dbUpdated, refetch, setDbUpdated]);

  const toggleRow = (index: number | null) => {
    setExpandedRow(expandedRow === index ? null : index);

    if (index === null) return;
  };

  // refund transaction if status is expired or failed
  const initiateRefund = (index: number) => {
    const transaction = transactionsHT[index];
    console.log("initiateRefund", transaction);
    if (transaction.status === "EXPIRED" || transaction.status === "FAILED") {
      refund(transaction);
    }
  };

  function getTooltipText(transaction: Transaction) {
    switch (transaction.status) {
      case "PENDING":
        return "Waiting for the transaction to be included in a block";
      case "COMPLETED":
        return "Expand for more details";
      case "FAILED":
        return `Transaction failed: Redeemable at ${new Date(transaction.hashLockTimestamp * 1000).toLocaleString()}`;
      case "REFUNDED":
        return "Transaction refunded";
      case "CACHED":
        return "Waiting for the transaction";
      case "EXPIRED":
        return `Transaction expired: You can initiate a refund`;
      default:
        return "";
    }
  }

  // Add this useWaitForTransaction hook for refund transactions
  useWaitForTransaction({
    hash: refundTxHash,
    onSuccess: receipt => {
      console.log("Refund transaction receipt:", receipt);

      // Dismiss the pending toast if it exists
      if (pendingToastId) {
        notification.remove(pendingToastId);
        setPendingToastId(null);
      }

      // Show success notification
      notification.success("Refund Completed");

      // Update the DB after the transaction is confirmed
      setTimeout(() => {
        setDbUpdated(true);
      }, 2000);

      // Reset the refund transaction hash and refunding status
      setRefundTxHash(undefined);
      setRefundingTransactionId(null);
    },
  });

  function refund(transaction: Transaction) {
    console.log("refunding", transaction);
    console.log("transaction.hashLockTimestamp", transaction.hashLockTimestamp);
    console.log("Date.now() / 1000", Date.now() / 1000);
    console.log("transaction.hashLockTimestamp > Date.now() / 1000", transaction.hashLockTimestamp > Date.now() / 1000);
    console.log("transaction.status", transaction.status);
    if (transaction.contractId === "") return;
    if (transaction.hashLockTimestamp > Date.now() / 1000) {
      return;
    }
    if (!htlcContract) return;
    console.log("refunding", transaction);

    // Set the refunding status before making the contract call
    setRefundingTransactionId(transaction.contractId);

    htlcContract.write
      .refund([transaction.contractId as `0x${string}`], {})
      .then(tx => {
        console.log(tx);
        setRefundTxHash(tx);

        // Create a persistent loading toast and store its ID
        const toastId = notification.loading("Refund transaction submitted, waiting for confirmation...");
        setPendingToastId(toastId);
      })
      .catch(e => {
        console.error(e);
        notification.error("Refund Failed");
        // Reset refunding status on error
        setRefundingTransactionId(null);
      });
  }

  // Get filtered transactions
  const getFilteredTransactions = () => {
    if (showReclaimableOnly) {
      return [...transactionsHT]
        .filter(tx => tx.transactionType === "SENT" && (tx.status === "EXPIRED" || tx.status === "FAILED"))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((tx, filteredIndex) => ({
          ...tx,
          originalIndex: transactionsHT.findIndex(original => original.txHash === tx.txHash),
        }));
    } else {
      return [...transactionsHT]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((tx, sortedIndex) => ({
          ...tx,
          originalIndex: transactionsHT.findIndex(original => original.txHash === tx.txHash),
        }));
    }
  };

  return (
    <div className="flex flex-1 justify-center mt-8 overflow-hidden max-h-[calc(100vh-500px)]">
      <div className="flex justify-center mx-0 w-full md:w-[100%] flex-col flex-1 px-4 md:px-0">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-center text-xl font-black flex-grow">HISTORY</h2>
          <div className="custom-tooltip">
            <button
              className={`btn btn-sm ${showReclaimableOnly ? "btn-accent" : "btn-neutral"}`}
              onClick={() => setShowReclaimableOnly(!showReclaimableOnly)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                />
              </svg>
              <span className="tooltip-text">
                {showReclaimableOnly
                  ? "Show all transactions"
                  : "Filter to show only reclaimable transactions (SENT and EXPIRED)"}
              </span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <style jsx global>{`
            /* Custom tooltip styling */
            .custom-tooltip {
              position: relative;
              display: flex;
              align-items: center;
            }

            .custom-tooltip .tooltip-text {
              visibility: hidden;
              width: 200px;
              background-color: #1a1a1a;
              color: #ffffff;
              text-align: center;
              border-radius: 6px;
              padding: 8px;
              position: absolute;
              z-index: 100;
              top: -10px;
              right: 40px;
              opacity: 0;
              transition: opacity 0.3s;
              font-size: 0.8rem;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
              border: 1px solid #333;
              pointer-events: none;
            }

            .custom-tooltip:hover .tooltip-text {
              visibility: visible;
              opacity: 1;
            }

            .custom-tooltip div:hover .tooltip-text {
              visibility: visible;
              opacity: 1;
            }
          `}</style>
          <table className="table border-spacing-y-4 mb-0 mt-0 p-0 border-0 w-full">
            <thead
              className="border-0 w-full m-0 p-0 bg-neutral z-10"
              style={{
                position: "sticky",
                top: "0",
                left: "0",
                width: "100%",
              }}
            >
              <tr className="text-sm font-extrabold border-0">
                <th className="text-left" style={{ width: "20%" }}>
                  TYPE
                </th>
                <th className="text-left" style={{ width: "25%" }}>
                  STATUS
                </th>
                <th className="text-left hidden md:table-cell" style={{ width: "30%" }}>
                  DATE
                </th>
                <th className="text-right" style={{ width: "25%" }}>
                  AMOUNT
                </th>
              </tr>
            </thead>
            <tbody>
              {transactionsHT.length > 0 ? (
                getFilteredTransactions().map((transaction, index) => (
                  <React.Fragment key={index}>
                    <tr
                      key={transaction.txHash}
                      style={{
                        backgroundColor:
                          transaction.status === "FAILED" || transaction.status === "EXPIRED"
                            ? "rgb(248, 113, 113)"
                            : index % 2 === 0
                            ? "transparent"
                            : "rgba(32, 32, 32, 0.75)",
                      }}
                    >
                      <td className="text-left text-white" style={{ width: "20%" }}>
                        {transaction.transactionType}
                      </td>
                      <td
                        className="text-left table-cell text-white uppercase cursor-pointer"
                        style={{ width: "25%" }}
                        onClick={account ? () => toggleRow(index) : undefined}
                      >
                        <div className="flex items-center custom-tooltip">
                          <span>{transaction.status}</span>
                          <div className="ml-2 relative">
                            <svg viewBox="0 0 1024 1024" fill="currentColor" height="1em" width="1em">
                              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" />
                              <path d="M464 336a48 48 0 1096 0 48 48 0 10-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z" />
                            </svg>
                            <span className="tooltip-text">{getTooltipText(transaction)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-left hidden md:table-cell text-white" style={{ width: "30%" }}>
                        {new Date(transaction.date).toLocaleString("en-US", {
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                          hour12: true,
                        })}
                      </td>
                      <td className="text-right table-cell text-white" style={{ width: "25%" }}>
                        {transaction.amount} sats
                      </td>
                    </tr>
                    {expandedRow === index && (
                      <tr key={transaction.contractId}>
                        <td colSpan={4}>
                          <div className="p-4 relative bg-base-200 rounded-lg border border-neutral">
                            {/* Header with close button */}
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-semibold">Transaction Details</h3>
                              <button className="btn btn-circle btn-sm" onClick={() => toggleRow(null)}>
                                X
                              </button>
                            </div>

                            {/* Transaction expiry info */}
                            {transaction.transactionType === "SENT" &&
                              (transaction.status === "FAILED" || transaction.status === "EXPIRED") && (
                                <div className="bg-red-900/30 p-3 rounded-lg mb-4 text-red-300 font-medium">
                                  <span className="font-bold">TimeLock expiry:</span>{" "}
                                  {new Date(transaction.hashLockTimestamp * 1000).toLocaleString()}
                                </div>
                              )}

                            {/* Transaction info grid */}
                            <div className="grid grid-cols-1 gap-3 mb-4">
                              {/* Transaction Hash */}
                              <div className="flex items-center bg-neutral/50 p-3 rounded-lg">
                                <button
                                  className="btn btn-square btn-sm mr-3"
                                  onClick={() => {
                                    navigator.clipboard.writeText(transaction.txHash);
                                    console.log("Transaction hash copied to clipboard");
                                  }}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-5 h-5"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"
                                    />
                                  </svg>
                                </button>
                                <div className="flex-grow">
                                  <div className="text-xs text-gray-400 font-semibold">Creation Transaction:</div>
                                  <div className="text-sm flex gap-2 items-center">
                                    {transaction?.txHash?.substring(0, 20)}...
                                    <a
                                      href={`https://3xpl.com/botanix/transaction/${transaction.txHash}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="btn btn-xs btn-secondary"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      View
                                    </a>
                                  </div>
                                </div>
                              </div>

                              {/* Contract ID */}
                              <div className="flex items-center bg-neutral/50 p-3 rounded-lg">
                                <button
                                  className="btn btn-square btn-sm mr-3"
                                  onClick={() => {
                                    navigator.clipboard.writeText(transaction.contractId);
                                    console.log("Contract ID copied to clipboard");
                                  }}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-5 h-5"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"
                                    />
                                  </svg>
                                </button>
                                <div>
                                  <div className="text-xs text-gray-400 font-semibold">Contract ID:</div>
                                  <div className="text-sm">{transaction.contractId.substring(0, 20)}...</div>
                                </div>
                              </div>

                              {/* Withdraw Transaction Hash - Only show if exists */}
                              {transaction.withdrawTxHash && (
                                <div className="flex items-center bg-green-900/30 p-3 rounded-lg">
                                  <button
                                    className="btn btn-square btn-sm mr-3"
                                    onClick={() => {
                                      navigator.clipboard.writeText(transaction.withdrawTxHash || "");
                                      console.log("Withdraw hash copied to clipboard");
                                    }}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={1.5}
                                      stroke="currentColor"
                                      className="w-5 h-5"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"
                                      />
                                    </svg>
                                  </button>
                                  <div className="flex-grow">
                                    <div className="text-xs text-gray-400 font-semibold">Withdraw Transaction:</div>
                                    <div className="text-sm flex gap-2 items-center">
                                      {transaction.withdrawTxHash?.substring(0, 20)}...
                                      <a
                                        href={`https://3xpl.com/botanix/transaction/${transaction.withdrawTxHash}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-xs btn-secondary"
                                        onClick={e => e.stopPropagation()}
                                      >
                                        View
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Refund Transaction Hash - Only show if exists */}
                              {transaction.refundTxHash && (
                                <div className="flex items-center bg-amber-900/30 p-3 rounded-lg">
                                  <button
                                    className="btn btn-square btn-sm mr-3"
                                    onClick={() => {
                                      navigator.clipboard.writeText(transaction.refundTxHash || "");
                                      console.log("Refund hash copied to clipboard");
                                    }}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={1.5}
                                      stroke="currentColor"
                                      className="w-5 h-5"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"
                                      />
                                    </svg>
                                  </button>
                                  <div className="flex-grow">
                                    <div className="text-xs text-gray-400 font-semibold">Refund Transaction:</div>
                                    <div className="text-sm flex gap-2 items-center">
                                      {transaction.refundTxHash?.substring(0, 20)}...
                                      <a
                                        href={`https://3xpl.com/botanix/transaction/${transaction.refundTxHash}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-xs btn-secondary"
                                        onClick={e => e.stopPropagation()}
                                      >
                                        View
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Refund button section - only shown for expired or failed SENT transactions */}
                            {transaction.transactionType === "SENT" &&
                              (transaction.status === "FAILED" || transaction.status === "EXPIRED") && (
                                <div className="flex justify-center mt-2">
                                  <button
                                    className={`btn ${
                                      (transaction.status === "FAILED" || transaction.status === "EXPIRED") &&
                                      transaction.hashLockTimestamp < Date.now() / 1000
                                        ? refundingTransactionId === transaction.contractId
                                          ? "btn-accent btn-md loading"
                                          : "btn-accent btn-md animate-pulse shadow-md shadow-accent/30"
                                        : "btn-disabled cursor-not-allowed bg-red-500/50 btn-md"
                                    }`}
                                    onClick={account ? () => initiateRefund(transaction.originalIndex) : undefined}
                                    disabled={
                                      ((transaction.status === "FAILED" || transaction.status === "EXPIRED") &&
                                        transaction.hashLockTimestamp > Date.now() / 1000) ||
                                      refundingTransactionId === transaction.contractId
                                    }
                                  >
                                    {refundingTransactionId === transaction.contractId ? (
                                      <>
                                        <span className="loading loading-spinner loading-sm mr-2"></span>
                                        Processing Refund...
                                      </>
                                    ) : transaction.hashLockTimestamp < Date.now() / 1000 ? (
                                      <>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          strokeWidth={1.5}
                                          stroke="currentColor"
                                          className="w-5 h-5 mr-2"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                                          />
                                        </svg>
                                        Initiate Refund
                                      </>
                                    ) : (
                                      <>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          strokeWidth={1.5}
                                          stroke="currentColor"
                                          className="w-5 h-5 mr-2"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        Waiting for Expiry
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  {account ? (
                    <td className="text-center py-4" colSpan={5}>
                      No history...go send your first lightning payment!
                    </td>
                  ) : (
                    <td className="text-center py-4" colSpan={5}>
                      Connect your wallet to view transaction history
                    </td>
                  )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
