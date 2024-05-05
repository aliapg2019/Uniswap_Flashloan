# Uniswap Flashloan

This repository contains a simple implementation of a flashloan using Uniswap on the Ethereum blockchain.

## Overview

A flashloan is a type of smart contract that allows users to borrow assets without providing collateral, as long as the borrowed funds are returned within the same transaction. This implementation demonstrates how to use a flashloan to arbitrage between two assets on Uniswap.

## Setup

1. **Clone the repository:**
   ```
   git clone https://github.com/aliapg2019/Uniswap_Flashloan.git
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Update configuration:**
   Update the `config.js` file with your Infura API key.

## Usage

To run the flashloan arbitrage script, use the following command:
   ```
   node flashloan.js
   ```

This script will execute a flashloan on Uniswap, perform an arbitrage trade, and repay the flashloan within a single transaction.

## Disclaimer

This code is for educational purposes only and should not be used in a production environment without proper testing and security auditing. Flashloans can be risky and are subject to various risks, including market volatility and contract vulnerabilities. Use at your own risk.
