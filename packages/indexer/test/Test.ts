import assert from "assert";
import { HashedTimeLock_LogHTLCNew, TestHelpers } from "generated";

const { MockDb, HashedTimeLock } = TestHelpers;

describe("HashedTimeLock contract LogHTLCNew event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for HashedTimeLock contract LogHTLCNew event
  const event = HashedTimeLock.LogHTLCNew.createMockEvent({
    /* It mocks event fields with default values. You can overwrite them if you need */
  });

  it("HashedTimeLock_LogHTLCNew is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await HashedTimeLock.LogHTLCNew.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualHashedTimeLockLogHTLCNew = mockDbUpdated.entities.HashedTimeLock_LogHTLCNew.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`,
    );

    // Creating the expected entity
    const expectedHashedTimeLockLogHTLCNew: HashedTimeLock_LogHTLCNew = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      contractId: event.params.contractId,
      sender: event.params.sender,
      receiver: event.params.receiver,
      amount: event.params.amount,
      hashlock: event.params.hashlock,
      timelock: event.params.timelock,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(
      actualHashedTimeLockLogHTLCNew,
      expectedHashedTimeLockLogHTLCNew,
      "Actual HashedTimeLockLogHTLCNew should be the same as the expectedHashedTimeLockLogHTLCNew",
    );
  });
});
