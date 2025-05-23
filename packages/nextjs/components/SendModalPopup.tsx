"use client";

import { useEffect, useRef, useState } from "react";
import { KIND } from "@lightning-evm-bridge/shared";
import { Scanner } from "@yudiel/react-qr-scanner";
import { PaymentRequestObject, decode } from "bolt11";
import { useWaitForTransaction, useWalletClient } from "wagmi";
import { PaymentInvoice } from "~~/components/PaymentInvoice";
import { useLightningApp } from "~~/hooks/LightningProvider";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { LnPaymentInvoice } from "~~/types/utils";
import { GWEIPERSAT } from "~~/utils/scaffold-eth/common";
import { notification } from "~~/utils/scaffold-eth/notification";

type SendModalProps = {
  isOpen: boolean;
  onClose: () => void;
  balance: number | null;
};

function SendModal({ isOpen, onClose, balance }: SendModalProps) {
  const { transactions, sendMessage, data } = useLightningApp();
  const { setDbUpdated } = useGlobalState();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [invoice, setInvoice] = useState<string>("");
  const lnInvoiceRef = useRef<LnPaymentInvoice | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  function cleanAndClose() {
    if (!processingPayment) {
      lnInvoiceRef.current = null;
      setTxHash(undefined);
    }

    setInvoice("");
    setContractId(null);
    setActiveStep(1);

    setTimeout(() => {
      setDbUpdated(true);
    }, 2000);
    onClose();
  }

  useEffect(() => {
    if (transactions.length === 0) return;
    const lastTransaction = transactions[0];
    if (lastTransaction.lnInvoice !== lnInvoiceRef.current?.lnInvoice) return;
    if (lastTransaction.status === "PENDING" && lastTransaction.contractId) {
      setActiveStep(3);
    }
    if (lastTransaction.status === "COMPLETED") {
      setActiveStep(4);
      setProcessingPayment(false);

      notification.success("Payment completed successfully!");

      setTimeout(() => {
        setDbUpdated(true);
      }, 2000);

      if (isOpen) {
        setTimeout(() => {
          cleanAndClose();
        }, 1500);
      } else {
        lnInvoiceRef.current = null;
        setTxHash(undefined);
      }
    }
    if (lastTransaction.status === "FAILED") {
      setActiveStep(4);
      setProcessingPayment(false);

      notification.error("Payment failed");

      setTimeout(() => {
        setDbUpdated(true);
      }, 2000);

      if (isOpen) {
        setTimeout(() => {
          cleanAndClose();
        }, 1500);
      } else {
        lnInvoiceRef.current = null;
        setTxHash(undefined);
      }
    }
  }, [transactions, isOpen]);

  useEffect(() => {
    if (!data) return;

    if (data.status === "success" && data.message === "Invoice withdrawn successfully.") {
      console.log("Received invoice withdrawn success message");
      setActiveStep(4);
      setProcessingPayment(false);

      notification.success("Payment completed successfully!");

      setTimeout(() => {
        setDbUpdated(true);
      }, 2000);

      if (isOpen) {
        setTimeout(() => {
          cleanAndClose();
        }, 1500);
      } else {
        lnInvoiceRef.current = null;
        setTxHash(undefined);
      }
    }
  }, [data, isOpen]);

  const { data: walletClient } = useWalletClient();
  const { data: htlcContract } = useScaffoldContract({
    contractName: "HashedTimelock",
    walletClient,
  });

  const [activeStep, setActiveStep] = useState<number>(1);

  function getMinTimelock(lnInvoiceTimelock: number) {
    const now = Math.floor(Date.now() / 1000);
    return Math.min(now + 600, lnInvoiceTimelock); // 10 minutes
  }

  function handleScan(data: any) {
    console.log("Scanning", data);
    handleInvoiceChange(data);
  }
  function handleError(err: any) {
    console.error(err);
  }

  function getPaymentHash(requestObject: PaymentRequestObject): `0x${string}` | undefined {
    const paymentHash = requestObject.tags.find((tag: any) => tag.tagName === "payment_hash");
    if (!paymentHash) {
      return undefined;
    }
    return ("0x" + paymentHash.data.toString()) as `0x${string}`;
  }

  function submitPayment() {
    console.log("submitting payment");
    if (!htlcContract) return;
    if (!lnInvoiceRef.current) return;

    setProcessingPayment(true);

    htlcContract.write
      .newContract(
        [
          process.env.LSP_ADDRESS ?? "0x7A02Bb41bBBd306A8E05d407928eaACeDF9c9395",
          lnInvoiceRef.current.paymentHash,
          BigInt(getMinTimelock(lnInvoiceRef.current.timeExpireDate)),
        ],
        {
          value: BigInt(lnInvoiceRef.current.satoshis * GWEIPERSAT),
        },
      )
      .then(tx => {
        console.log("then txHash", tx);
        setActiveStep(2);
        setTxHash(tx);
      })
      .catch(e => {
        console.error(e.message);
        notification.error("User rejected transaction");
        setProcessingPayment(false);

        setTimeout(() => {
          setDbUpdated(true);
        }, 2000);

        cleanAndClose();
      });
  }

  useWaitForTransaction({
    hash: txHash,
    onSuccess: receipt => {
      console.log("Transaction receipt:", receipt);
      if (receipt.logs.length >= 0) {
        const contractId = receipt.logs[0].topics[1];
        console.log("Contract ID from receipt:", contractId);
        setActiveStep(3);

        setTimeout(() => {
          setDbUpdated(true);
        }, 2000);

        sendMessage({
          contractId: contractId as string,
          kind: KIND.INVOICE_SEND,
          lnInvoice: lnInvoiceRef.current?.lnInvoice as string,
          txHash: txHash as string,
        });
      }
    },
  });

  function handleInvoiceChange(invoice: string) {
    try {
      setInvoice(invoice);
      const tempdecoded = decode(invoice);
      const paymentHash = getPaymentHash(tempdecoded);

      if (!tempdecoded.satoshis) return;
      if (!paymentHash) return;
      if (!tempdecoded.timeExpireDate) return;

      console;

      lnInvoiceRef.current = {
        satoshis: tempdecoded.satoshis,
        timeExpireDate: tempdecoded.timeExpireDate,
        paymentHash,
        lnInvoice: invoice,
      };
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-40 flex justify-center items-center font-mono">
          <div className="card lg:w-1/3 md:w-1/2 w-full bg-base-200 rounded-lg md:h-auto">
            <div className="flex w-full items-center justify-center relative text-white bg-brand-bg pt-4 rounded-t-lg">
              <span className="">{lnInvoiceRef.current == null ? "Scan QR Code" : "Review"}</span>
              <button
                onClick={cleanAndClose}
                className="btn-neutral absolute right-5 top-1/2 transform -translate-y-2 btn btn-circle btn-sm"
              >
                X
              </button>
            </div>
            <div className="flex flex-col items-center justify-center p-6">
              {!lnInvoiceRef.current && (
                <div className="flex w-full flex-col items-center gap-5">
                  {/* QR Scanner */}
                  <Scanner
                    onError={handleError}
                    onResult={result => handleScan(result)}
                    // onDecode={result => handleScan(result)}
                  />
                  <div className="join w-full">
                    <button
                      className="btn join-item cursor-pointer bg-gray-600 p-2"
                      onClick={() => {
                        navigator.clipboard.readText().then(text => {
                          handleInvoiceChange(text);
                        });
                      }}
                    >
                      Paste
                    </button>
                    <input
                      type="text"
                      placeholder="ln1232...."
                      className="input input-bordered join-item w-full"
                      value={invoice}
                      onChange={e => handleInvoiceChange(e.target.value)}
                    />
                  </div>
                </div>
              )}
              {lnInvoiceRef.current && (
                <PaymentInvoice
                  invoice={lnInvoiceRef.current}
                  submitPayment={submitPayment}
                  contractId={contractId}
                  step={activeStep}
                  balance={balance}
                  expiryDate={getMinTimelock(lnInvoiceRef.current.timeExpireDate).toString()}
                  cancelPayment={() => {
                    lnInvoiceRef.current = null;
                    setInvoice("");
                    setContractId(null);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SendModal;
