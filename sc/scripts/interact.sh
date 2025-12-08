#!/bin/bash

# Script para interactuar con el contrato desplegado
source .env

# Función para llamar al contrato
call_contract() {
    local method=$1
    local params=$2
    cast send $CONTRACT_ADDRESS "$method" $params --rpc-url $RPC_URL --private-key $ADMIN_PRIVATE_KEY
}

echo "Script de interacción con el contrato SupplyChainTracker"
echo "Contrato: $CONTRACT_ADDRESS"
echo "RPC URL: $RPC_URL"
echo ""
echo "Comandos útiles:"
echo "  call_contract 'methodName' 'param1 param2 ...'"
echo "  cast call $CONTRACT_ADDRESS 'methodName' --rpc-url $RPC_URL"
