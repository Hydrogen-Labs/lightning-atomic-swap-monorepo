import { useEffect, useRef, useState } from "react";
import { HistoryTable } from "./HistoryTable";
import ReceiveModal from "./ReceiveModalPopup";
import SendModalPopup from "./SendModalPopup";
import { useAccount } from "wagmi";
import { useLightningApp } from "~~/hooks/LightningProvider";
import { useAccountBalance } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { notification } from "~~/utils/scaffold-eth/notification";

interface ConnectedInterfaceProps {
  account: string;
}

const ConnectedInterface = ({ account }: ConnectedInterfaceProps) => {
  const { address } = useAccount();
  const { balance } = useAccountBalance(address);
  const { isWebSocketConnected, price, transactions } = useLightningApp();
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const onCloseSendModal = () => setIsSendModalOpen(false);
  const onOpenSendModal = () => setIsSendModalOpen(true);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const onCloseReceiveModal = () => setIsReceiveModalOpen(false);
  const onOpenReceiveModal = () => setIsReceiveModalOpen(true);
  const [balanceVisibility, setBalanceVisibility] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationText, setAnimationText] = useState("");
  const [animationType, setAnimationType] = useState("");
  const previousBalanceRef = useRef(balance);
  const previousTransactionsRef = useRef(transactions);
  const { setDbUpdated } = useGlobalState();

  // Monitor transactions for status changes even when modals are closed
  useEffect(() => {
    if (previousTransactionsRef.current.length === 0 || transactions.length === 0) {
      previousTransactionsRef.current = transactions;
      return;
    }

    // Check if any transaction has changed status
    for (const transaction of transactions) {
      const prevTransaction = previousTransactionsRef.current.find(t => t.contractId === transaction.contractId);

      if (prevTransaction && prevTransaction.status !== transaction.status) {
        // A transaction's status has changed
        if (transaction.status === "COMPLETED") {
          // Show notification for completed transaction
          notification.success(
            `${transaction.transactionType === "SENT" ? "Payment" : "Receipt"} completed successfully!`,
          );
        } else if (transaction.status === "FAILED") {
          // Show notification for failed transaction
          notification.error(`${transaction.transactionType === "SENT" ? "Payment" : "Receipt"} failed`);
        }
      }
    }

    previousTransactionsRef.current = transactions;
  }, [transactions]);

  useEffect(() => {
    if (previousBalanceRef.current !== null && balance !== null && previousBalanceRef.current !== balance) {
      const diff = balance - previousBalanceRef.current;
      if (diff !== 0) {
        const diffSats = Math.floor(Math.abs(diff) * 100_000_000);
        const text = `${diff > 0 ? "+" : "-"} ${diffSats.toLocaleString()} sats`;
        setAnimationText(text);
        setAnimationType(diff > 0 ? "increase" : "decrease");
        setShowAnimation(true);

        setTimeout(() => {
          setDbUpdated(true);
          setShowAnimation(false);
        }, 2000);
      }
    }
    previousBalanceRef.current = balance;
  }, [balance, setDbUpdated]);

  function getBalanceWithVisibility() {
    if (balance === null) return "Loading Balance...";
    if (balanceVisibility === 0) {
      return `${Math.floor(balance * 100_000_000).toLocaleString()} sats`;
    }
    if (balanceVisibility === 1) {
      return `$${(balance * price).toFixed(2)} USD`;
    }
    if (balanceVisibility === 2) {
      return "****** sats";
    }
  }

  return (
    <>
      <div className="card-header text-white p-4 flex-shrink-0 relative">
        <h1 className="cursor-default text-center text-3xl font-mono mt-10">Balance</h1>
        <h1
          className="cursor-pointer text-center text-3xl font-mono"
          onClick={() => setBalanceVisibility((balanceVisibility + 1) % 3)}
        >
          {getBalanceWithVisibility()}
        </h1>

        {showAnimation && (
          <div
            className={`absolute left-1/2 transform -translate-x-1/2 text-2xl font-mono animate-fadeInUp ${
              animationType === "increase" ? "text-green-500" : "text-red-500"
            }`}
          >
            {animationText}
          </div>
        )}
      </div>

      <div className="card-footer flex py-4 justify-between items-center font-mono flex-shrink-0">
        <div className="join w-full px-4 md:px-0">
          <button
            className="btn btn-neutral join-item w-1/2 disabled:opacity-50 glow glow-on-hover outline-none focus:outline-none ring-violet-800 ring-2 ring-offset-2"
            disabled={!isWebSocketConnected || balance === null || address === undefined}
            onClick={onOpenReceiveModal}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 4.5-15 15m0 0h11.25m-11.25 0V8.25" />
            </svg>
            Receive{" "}
          </button>
          <button
            className="btn btn-neutral join-item w-1/2 disabled:opacity-50 glow glow-on-hover outline-none focus:outline-none ring-violet-800 ring-2 ring-offset-2"
            disabled={!isWebSocketConnected || balance === null || address === undefined}
            onClick={onOpenSendModal}
          >
            Send
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </button>
        </div>
      </div>

      <HistoryTable account={account} isWebSocketConnected={isWebSocketConnected} />

      <SendModalPopup isOpen={isSendModalOpen} onClose={onCloseSendModal} balance={balance} />
      <ReceiveModal isOpen={isReceiveModalOpen} onClose={onCloseReceiveModal} />
    </>
  );
};

export default ConnectedInterface;
