import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { ethers } from "ethers";
import express, { Request, Response } from "express";
import { sha256 } from "js-sha256";
import {
  ContractDetails,
  KIND,
  RelayRequest,
  RelayResponse,
  deployedContracts,
  parseContractDetails,
} from "./../../shared";
import { RelayServerDashboard } from "./dashboard";
import { logger } from "./logger";
import { RelayServerState } from "./types";

dotenv.config();

const { PORT, RPC_URL, LSP_PRIVATE_KEY, CHAIN_ID } = process.env;

if (!RPC_URL || !LSP_PRIVATE_KEY || !CHAIN_ID || !PORT) {
  logger.error("Missing environment variables");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(LSP_PRIVATE_KEY, provider);
const htlcContractInfo = deployedContracts[CHAIN_ID]?.HashedTimelock;
const htlcContract = new ethers.Contract(htlcContractInfo.address, htlcContractInfo.abi, signer);

// Initialize server state
const serverState: RelayServerState = {
  serverAddress: signer.address,
  chainId: CHAIN_ID,
  rpcUrl: RPC_URL,
  htlcContract: htlcContract,
  contractDetails: new Map<string, ContractDetails>(),
  recentRequests: [] as RelayRequest[],
  recentResponses: [] as RelayResponse[],
  pendingContracts: [] as string[],
  provider: provider,
};

// Initialize the dashboard
const dashboard = new RelayServerDashboard(serverState, {
  updateInterval: 2000,
  maxLogs: 200,
});

const app = express();

// Middleware to parse JSON bodies
app.use(cors());
app.use(bodyParser.json());

// Post route to handle relay requests
app.post("/relay", async (req: Request, res: Response) => {
  try {
    const { kind, contractId, preimage } = req.body as RelayRequest;

    if (kind === KIND.RELAY_REQUEST && contractId && preimage) {
      logger.info(`Received relay request for contract ID: ${contractId} with preimage: ${preimage}`);

      // Add to recent requests with amount included
      const request = {
        kind,
        contractId,
        preimage,
      } as RelayRequest;

      serverState.recentRequests.unshift(request);
      if (serverState.recentRequests.length > 10) {
        serverState.recentRequests.pop();
      }

      // Add to pending contracts
      if (!serverState.pendingContracts.includes(contractId)) {
        serverState.pendingContracts.push(contractId);
      }

      if (await validateContractAndPreimage(contractId, preimage)) {
        await htlcContract
          .withdraw(contractId, "0x" + preimage)
          .then(async (tx: any) => {
            await tx.wait().then(async () => {
              logger.info("Withdrawal Transaction:", tx);

              // Update contract details to show withdrawal completed
              const updatedDetails = await getContractDetails(contractId);
              serverState.contractDetails.set(contractId, updatedDetails);

              const msg: RelayResponse = {
                kind: KIND.RELAY_RESPONSE,
                status: "success",
                txHash: tx.hash,
                contractId: contractId,
              };

              // Add to recent responses
              serverState.recentResponses.unshift(msg);
              if (serverState.recentResponses.length > 10) {
                serverState.recentResponses.pop();
              }

              // Remove from pending contracts
              serverState.pendingContracts = serverState.pendingContracts.filter(id => id !== contractId);

              res.status(200).send(msg);
            });
          })
          .catch((error: any) => {
            logger.error("Withdrawal Error:", error);

            // Remove from pending contracts when there's an error
            serverState.pendingContracts = serverState.pendingContracts.filter(id => id !== contractId);

            res.status(500).send({ message: "Failed to withdraw contract" });
          });
      } else {
        res.status(400).send({ message: "Unable to validate contract and preimage" });
        return;
      }
    } else {
      res.status(400).send({ message: "Invalid request" });
    }
  } catch (error) {
    logger.error("Error processing request:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);

  // Start the dashboard
  dashboard.start();
});

async function validateContractAndPreimage(contractId: string, preimage: string) {
  const contractDetails: ContractDetails = await getContractDetails(contractId);

  logger.info("Contract Details:", contractDetails);

  // Store contract details in server state
  serverState.contractDetails.set(contractId, contractDetails);

  if (!contractDetails) {
    logger.error("Contract not found");
    return false;
  }

  const hash = sha256.hex(new Uint8Array(Buffer.from(preimage, "hex")));

  if (contractDetails.hashlock !== "0x" + hash) {
    logger.error("Preimage does not match");
    return false;
  }

  if (contractDetails.withdrawn) {
    logger.error("Contract already withdrawn");
    return false;
  }

  if (contractDetails.refunded) {
    logger.error("Contract already refunded");
    return false;
  }

  return true;
}

async function getContractDetails(contractId: string): Promise<ContractDetails> {
  const response: any = await htlcContract.getContract(contractId);
  return parseContractDetails(response);
}
