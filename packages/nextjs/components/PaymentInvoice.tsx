import React, { useCallback, useMemo } from "react";
import { useLightningApp } from "~~/hooks/LightningProvider";
import { LnPaymentInvoice } from "~~/types/utils";

type StepInfo = {
  title: string;
  description: string;
};

type PaymentInvoiceProps = {
  invoice: LnPaymentInvoice;
  contractId: string | null;
  expiryDate: string;
  submitPayment: () => void;
  cancelPayment: () => void;
  step: number;
  balance: number | null;
};

export const steps: readonly StepInfo[] = [
  { title: "Verify Invoice", description: "Verify the invoice is correct" },
  { title: "Pay deposit", description: "On-chain invoice locked in smart contract" },
  {
    title: "Waiting to be included in a block",
    description: "The invoice id is sent and verified by the lightning provider",
  },
  { title: "Paid", description: "The lightning provider pays lightning invoice. The receiver must be online." },
] as const;

export const PaymentInvoice: React.FC<PaymentInvoiceProps> = ({
  invoice,
  submitPayment,
  cancelPayment,
  step,
  balance,
}) => {
  const { price, signerActive, transactions } = useLightningApp();

  // Memoize expensive calculations
  const expiryDate = useMemo(() => new Date(invoice.timeExpireDate * 1000), [invoice.timeExpireDate]);
  const isPaid = useMemo(
    () => transactions.some(transaction => transaction.lnInvoice === invoice.lnInvoice),
    [transactions, invoice.lnInvoice],
  );
  const satoshiBalance = useMemo(() => (balance ?? 0) * 100_000_000, [balance]);

  // Memoize the BTC to USD conversion
  const formatBTCBalance = useCallback(
    (sats: number) => {
      const btcValue = sats / 100_000_000;
      const fiatValue = btcValue * price;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(fiatValue);
    },
    [price],
  );

  const isPaymentDisabled = step === 2 || step === 3 || !signerActive;
  const insufficientBalance = satoshiBalance < invoice.satoshis;

  return (
    <div className="flex h-full flex-col justify-evenly content-evenly gap-5">
      <table className="w-full text-white text-sm">
        <tbody>
          <tr>
            <td className="border-transparent">Expiry Time</td>
            <td className="border-transparent text-right" title={expiryDate.toISOString()}>
              {expiryDate.toLocaleString()}
            </td>
          </tr>
          <tr>
            <td className="border-transparent">Amount</td>
            <td className="border-transparent text-right">{invoice.satoshis.toLocaleString()} sats</td>
          </tr>
          <tr>
            <td className="border-transparent">USD</td>
            <td className="border-transparent text-right">{formatBTCBalance(invoice.satoshis)}</td>
          </tr>
          <tr>
            <td className="border-transparent">Service Fee</td>
            <td className="border-transparent text-right">0 sats</td>
          </tr>
        </tbody>
      </table>

      {/* Stepper Component */}
      <ul className="steps steps-vertical">
        {steps.map((stepInfo, index) => (
          <li
            key={index}
            className={`${index < step ? "step step-primary" : "step"} text-gray-400`}
            title={stepInfo.description}
          >
            <div className="flex flex-col text-start">
              {stepInfo.title}
              {step === index && <span className="loading loading-dots" aria-label="Processing"></span>}
            </div>
          </li>
        ))}
      </ul>

      {/* Action Buttons */}
      {step < 2 ? (
        <div className="w-full flex justify-between gap-4">
          <button
            className="btn w-2/5 text-white/90 bg-transparent hover:bg-white/5 
            border border-white/20 hover:border-white/40
            disabled:text-white/40 disabled:border-white/10 disabled:hover:bg-transparent
            transition-all duration-200"
            onClick={cancelPayment}
            disabled={isPaymentDisabled}
            aria-label="Cancel payment"
          >
            Cancel
          </button>
          <button
            className={`btn w-2/5 text-white/90 border transition-all duration-200
              ${
                isPaid || insufficientBalance
                  ? "bg-red-500/20 hover:bg-red-500/30 border-red-500/40 hover:border-red-500/60"
                  : "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 hover:border-emerald-500/60"
              } disabled:text-white/40 disabled:bg-opacity-10 disabled:border-opacity-20 disabled:hover:bg-opacity-10`}
            onClick={submitPayment}
            disabled={isPaymentDisabled || isPaid || insufficientBalance}
            aria-label={isPaid ? "Already paid" : insufficientBalance ? "Insufficient balance" : "Submit payment"}
          >
            {isPaid ? "Already Paid" : insufficientBalance ? "Insufficient Balance" : "Pay"}
          </button>
        </div>
      ) : (
        <button
          className="btn w-full text-white/90 bg-white/5 hover:bg-white/10 
          border border-white/20 hover:border-white/40
          disabled:text-white/40 disabled:bg-white/5 disabled:border-white/10
          transition-all duration-200"
          onClick={cancelPayment}
          disabled={isPaymentDisabled}
          aria-label="Close payment dialog"
        >
          Close
        </button>
      )}
    </div>
  );
};
