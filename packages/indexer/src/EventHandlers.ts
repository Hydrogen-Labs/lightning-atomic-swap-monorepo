/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  HashedTimeLock,
  HashedTimeLock_LogHTLCNew,
  HashedTimeLock_LogHTLCRefund,
  HashedTimeLock_LogHTLCWithdraw,
} from "generated";

HashedTimeLock.LogHTLCNew.handler(async ({ event, context }) => {
  const entity: HashedTimeLock_LogHTLCNew = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    contractId: event.params.contractId,
    sender: event.params.sender.toLowerCase(),
    receiver: event.params.receiver.toLowerCase(),
    amount: event.params.amount,
    hashlock: event.params.hashlock,
    timelock: event.params.timelock,
    timestamp: BigInt(event.block.timestamp),
    txHash: event.transaction.hash,
  };

  context.HashedTimeLock_LogHTLCNew.set(entity);
});

HashedTimeLock.LogHTLCRefund.handler(async ({ event, context }) => {
  const entity: HashedTimeLock_LogHTLCRefund = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    contractId: event.params.contractId,
    timestamp: BigInt(event.block.timestamp),
    txHash: event.transaction.hash,
  };

  context.HashedTimeLock_LogHTLCRefund.set(entity);
});

HashedTimeLock.LogHTLCWithdraw.handler(async ({ event, context }) => {
  const entity: HashedTimeLock_LogHTLCWithdraw = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    contractId: event.params.contractId,
    timestamp: BigInt(event.block.timestamp),
    txHash: event.transaction.hash,
  };

  context.HashedTimeLock_LogHTLCWithdraw.set(entity);
});
