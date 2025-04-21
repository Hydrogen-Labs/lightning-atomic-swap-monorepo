# Relay Server for Lightning EVM Bridge

The Relay Server is a crucial component of the Lightning EVM Bridge system, handling the automation of Hashed Timelock Contract (HTLC) claims. This server's primary role is to facilitate the secure and timely claiming of HTLCs on behalf of users who might not have the necessary resources (like gas for transaction fees) to do it themselves.

## Overview

The Relay Server monitors blockchain events related to HTLCs and interacts directly with the smart contracts to execute claims. This process is critical for ensuring that the payment channel is reliable and that the participants receive their funds in a timely manner.

## Features

- Processes relay requests to withdraw funds from HTLC contracts
- Validates preimages against hashlocks
- Verifies contract status (not already withdrawn or refunded)
- Interactive Terminal Dashboard for monitoring server activity

## Dashboard

The server includes an interactive terminal-based dashboard that shows:

1. **Server Status** - Address, chain ID, RPC URL, and native balance
2. **Recent Contracts** - List of recent contract details
3. **Pending Contracts** - Contracts waiting to be processed
4. **Recent Relay Requests** - Recent requests received
5. **Server Logs** - Real-time logs with filtering capabilities

### Dashboard Controls

- **q** or **Ctrl+C** - Quit the dashboard and server
- **r** - Refresh dashboard data
- **c** - Clear log filters
- **Click** on items to filter logs by related ID

## Setup

### Requirements

- Node.js (v18 LTS)
- Yarn (v1 or v2+)
- Access to an Ethereum RPC endpoint

### Installation

1. **Clone the repository if not already done:**

   ```bash
   git clone https://github.com/diyahir/lightning-dapp.git
   cd lightning-dapp/packages/relay-server
   ```

2. **Install dependencies:**

   ```bash
   yarn install
   ```

3. **Environment Setup:**

Create an `.env` file based on the `sample.env` template included in the directory. Update the following keys with appropriate values:

```plaintext
RPC_URL="your_ethereum_rpc_url"
PRIVATE_KEY="your_private_key_for_transaction_signing"
```

### Running the Relay-Server

- **With Docker:**

  ```bash
  docker-compose up --build
  ```

- **Manually:**

  ```bash
  yarn start
  ```

  This command will initiate the server, which listens for blockchain events and processes HTLC claims automatically.

## Future Enhancements

- **Optimization of Gas Usage**: Implement strategies to minimize gas costs when claiming HTLCs.
- **Support for Multiple Chains**: Extend support to multiple EVM-compatible chains to enhance the utility of the service.
- **Enhanced Error Handling**: Develop robust error handling mechanisms to deal with unforeseen network or smart contract errors.
