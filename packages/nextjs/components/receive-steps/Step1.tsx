import { AddressInput, IntegerInput } from "../scaffold-eth";
import { ProviderConfig } from "@lightning-evm-bridge/shared";
import { PaymentRequestObject, decode } from "bolt11";
import QRCode from "qrcode.react";
import { isAddress } from "viem";

export function Step1({
  amount,
  invoice,
  recipientAddress,
  signerActive,
  price,
  serverConfig,
  setRecipientAddress,
  setAmount,
  onClickContinue,
  onClickQRCode,
}: {
  amount: bigint;
  invoice: string;
  recipientAddress: string;
  signerActive: boolean;
  price: number;
  serverConfig: ProviderConfig | null;
  setRecipientAddress: (val: string) => void;
  setAmount: (val: bigint) => void;
  onClickContinue: () => void;
  onClickQRCode: () => void;
}) {
  let paymentRequest: PaymentRequestObject = {
    satoshis: Number(0),
    tags: [{ tagName: "payment_hash", data: "abc123" }],
  };
  if (invoice !== "") {
    paymentRequest = decode(invoice);
  }

  // Validate amount against min/max
  const amountNum = Number(amount);
  const minAmount = serverConfig?.minSats || 0;
  const maxAmount = serverConfig?.maxSats || Infinity;
  const isBelowMin = amountNum > 0 && amountNum < minAmount;
  const isAboveMax = maxAmount !== Infinity && amountNum > maxAmount;
  const amountError = isBelowMin
    ? `Amount must be at least ${minAmount} sats`
    : isAboveMax
    ? `Amount must be no more than ${maxAmount} sats`
    : "";
  const hasAmountError = amountError !== "";

  function isGenerateQRDisabled(): boolean {
    return amount === BigInt(0) || invoice !== "" || hasAmountError;
  }

  // Calculate service fee based on provider config
  const serviceFee = serverConfig
    ? serverConfig.receiveBaseFee + (Number(amount) * serverConfig.receiveBasisPointFee) / 10000
    : 0;

  // Calculate amount in USD
  const amountUSD = price > 0 ? (Number(amount) * price) / 100000000 : 0;

  return (
    <div className="flex flex-col text-start w-full gap-2">
      <div className="flex-col">
        <span className="text-sm text-gray-500">Recipient Address</span>
        <AddressInput
          placeholder="0x123...321"
          value={recipientAddress}
          onChange={newAddress => {
            setRecipientAddress(newAddress);
          }}
          disabled={invoice !== ""}
        />
      </div>
      <div className="flex-col relative">
        <div className="mb-1">
          <span className="text-sm text-gray-500">Amount Receiving (sats)</span>
        </div>
        <div className={`w-full ${hasAmountError ? "tooltip tooltip-open tooltip-error" : ""}`} data-tip={amountError}>
          <div className={`w-full ${hasAmountError ? "border border-error rounded-md" : ""}`}>
            <IntegerInput
              value={amount}
              onChange={val => setAmount(BigInt(val))}
              disableMultiplyBy1e18
              disabled={invoice !== ""}
            />
          </div>
        </div>
        <div className="mt-2 text-sm space-y-1">
          <div className="flex justify-between text-gray-500">
            <span>Received Amount</span>
            <span>{Number(amount).toLocaleString()} sats</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Received Amount in USD </span>
            <span>${amountUSD.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>
              Service Fee{" "}
              {serverConfig && (
                <span className="text-xs ml-1">
                  ({serverConfig.receiveBaseFee} base + {serverConfig.receiveBasisPointFee / 100}% of amount)
                </span>
              )}
            </span>
            <span>{serviceFee.toLocaleString()} sats</span>
          </div>
        </div>
      </div>
      <button
        className="btn btn-secondary rounded-none w-full"
        disabled={isGenerateQRDisabled() || recipientAddress === "" || !signerActive || !isAddress(recipientAddress)}
        onClick={() => onClickContinue()}
      >
        Generate Service Fee Invoice
      </button>
      {invoice && (
        <div className="flex flex-col w-full gap-2 h-full">
          <button
            className="btn btn-neutral rounded-none text-center w-full"
            onClick={() => {
              onClickQRCode();
            }}
          >
            Copy Invoice
          </button>
          <div className="flex flex-col items-center">
            <QRCode size={250} value={invoice} className="" />
          </div>
          <div className="flex flex-col">
            <span className="text-center text-gray-500">Service Fee: {paymentRequest.satoshis} sats</span>
          </div>
        </div>
      )}
    </div>
  );
}
