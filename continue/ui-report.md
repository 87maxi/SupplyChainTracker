# UI Issue Report for SupplyChainTracker

## Issue Description

The transaction functionality in the RoleRequest component is not working properly. When users attempt to request a role, the transaction is not being executed on the blockchain, and there is no proper feedback about what is going wrong.

## Root Cause Analysis

After investigating the code and configuration, I've identified the following issues:

### 1. Contract Address Configuration Mismatch

The frontend is looking for `NEXT_PUBLIC_CONTRACT_ADDRESS` in environment variables, but the deploy script creates a `.env` file in the `sc/` directory with `CONTRACT_ADDRESS` (without the `NEXT_PUBLIC_` prefix):

```bash
# In sc/.env (created by deploy.sh)
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# In web/.env.example (frontend expects this)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 2. Missing Environment Variables in Deploy Script

The deployment script `Deploy.s.sol` requires `ADMIN_PRIVATE_KEY` but this is not being set in the environment before deployment:

```solidity
// In sc/script/Deploy.s.sol
uint256 adminPrivateKey = vm.envUint("ADMIN_PRIVATE_KEY");
```

### 3. Inconsistent Environment Variable Usage

Different parts of the application use different environment variable names:
- Frontend: `NEXT_PUBLIC_CONTRACT_ADDRESS`, `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_CHAIN_ID`
- Contract scripts: `CONTRACT_ADDRESS`, `RPC_URL`, `ADMIN_PRIVATE_KEY`

## Recommended Fixes

### 1. Update .env.example with Correct Variables

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
```

### 2. Modify Deploy Script to Set Proper Environment Variables

Update `sc/scripts/deploy.sh` to export the correct environment variable names that the frontend expects:

```bash
# After deploying, create .env with NEXT_PUBLIC_ prefix
cat > .env << EOF
NEXT_PUBLIC_RPC_URL=$RPC_URL
NEXT_PUBLIC_CONTRACT_ADDRESS=$CONTRACT_ADDRESS
ADMIN_PRIVATE_KEY=$PRIVATE_KEY
EOF
```

### 3. Ensure Private Key is Available During Deployment

Set the ADMIN_PRIVATE_KEY before running the deploy script:

```bash
export ADMIN_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
./scripts/deploy.sh
```

## Implementation Steps

1. Update `web/.env.example` with the correct environment variable names
2. Modify `sc/scripts/deploy.sh` to create environment files with the proper prefix
3. Ensure the ADMIN_PRIVATE_KEY is set before deployment
4. Verify the contract is properly deployed and the frontend can connect to it

These changes will ensure the frontend can properly connect to the deployed contract and transactions can be executed successfully.