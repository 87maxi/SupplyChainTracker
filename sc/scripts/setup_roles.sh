#!/bin/bash

# Script para configurar los roles del sistema SupplyChainTracker
# Usa la primera cuenta de anvil como administrador

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Configurando roles del sistema SupplyChainTracker...${NC}"

# Verificar que Foundry esté instalado
if ! command -v cast &> /dev/null; then
    echo -e "${RED}Error: Foundry no está instalado. Instala Foundry primero.${NC}"
    exit 1
fi

# Cargar variables de entorno
if [ -f .env ]; then
    source .env
else
    echo -e "${RED}Error: Archivo .env no encontrado. Ejecuta primero deploy.sh${NC}"
    exit 1
fi

# Direcciones de las cuentas de anvil (predefinidas)
ADMIN_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
FABRICANTE_ADDRESS="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
AUDITOR_ADDRESS="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
TECNICO_ADDRESS="0x90F79bf6EB2c4f870365E785982E1f101E93b906"
ESCUELA_ADDRESS="0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"

# Hashes de los roles (deben coincidir con el contrato)
FABRICANTE_ROLE_HASH="0x49c0376dc7caa3eab0c186e9bc20bf968b0724fea74a37706c35f59bc5d8b15b"
AUDITOR_HW_ROLE_HASH="0xbe0c84bfff967b2deb88bd0540d4a796d0ebfdcb72262ced26f1892b419e6457"
TECNICO_SW_ROLE_HASH="0xa8f5858ea94a9ede7bc5dd04119dcc24b3b02a20be15d673993d8b6c2a901ef9"
ESCUELA_ROLE_HASH="0xeeb4ddf6a0e2f06cb86713282a0b88ee789709e92a08b9e9b4ce816bbb13fcaf"

echo -e "${YELLOW}Configurando roles para las cuentas:${NC}"
echo -e "Admin: $ADMIN_ADDRESS"
echo -e "Fabricante: $FABRICANTE_ADDRESS"
echo -e "Auditor HW: $AUDITOR_ADDRESS"
echo -e "Técnico SW: $TECNICO_ADDRESS"
echo -e "Escuela: $ESCUELA_ADDRESS"

# Función para aprobar un rol
approve_role() {
    local role_hash=$1
    local account=$2
    local role_name=$3
    
    echo -e "${YELLOW}Aprobando rol $role_name para $account...${NC}"
    
    # Primero solicitar el rol (desde la cuenta destino)
    cast send $CONTRACT_ADDRESS \
        "requestRoleApproval(bytes32)" $role_hash \
        --rpc-url $RPC_URL \
        --private-key $(get_private_key $account)
    
    # Luego aprobar el rol (desde el admin)
    cast send $CONTRACT_ADDRESS \
        "approveRole(bytes32,address)" $role_hash $account \
        --rpc-url $RPC_URL \
        --private-key $ADMIN_PRIVATE_KEY
    
    echo -e "${GREEN}✅ Rol $role_name aprobado para $account${NC}"
}

# Función para obtener la private key basada en la dirección
get_private_key() {
    local address=$1
    
    # Private keys predefinidas de anvil
    case $address in
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
            echo "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
            ;;
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8")
            echo "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
            ;;
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")
            echo "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
            ;;
        "0x90F79bf6EB2c4f870365E785982E1f101E93b906")
            echo "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"
            ;;
        "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65")
            echo "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
            ;;
        *)
            echo -e "${RED}Error: Private key no encontrada para $address${NC}"
            exit 1
            ;;
    esac
}

# Configurar todos los roles
approve_role $FABRICANTE_ROLE_HASH $FABRICANTE_ADDRESS "FABRICANTE"
approve_role $AUDITOR_HW_ROLE_HASH $AUDITOR_ADDRESS "AUDITOR_HW"
approve_role $TECNICO_SW_ROLE_HASH $TECNICO_ADDRESS "TECNICO_SW"
approve_role $ESCUELA_ROLE_HASH $ESCUELA_ADDRESS "ESCUELA"

echo -e "${GREEN}✅ Todos los roles configurados exitosamente!${NC}"

# Verificar los roles configurados
echo -e "${YELLOW}Verificando configuración de roles...${NC}"

verify_role() {
    local role_hash=$1
    local account=$2
    local role_name=$3
    
    echo -e "Verificando rol $role_name para $account:"
    cast call $CONTRACT_ADDRESS \
        "getRoleStatus(bytes32,address)((bytes32,address,uint8,uint256,address))" \
        $role_hash $account \
        --rpc-url $RPC_URL
    echo ""
}

verify_role $FABRICANTE_ROLE_HASH $FABRICANTE_ADDRESS "FABRICANTE"
verify_role $AUDITOR_HW_ROLE_HASH $AUDITOR_ADDRESS "AUDITOR_HW"
verify_role $TECNICO_SW_ROLE_HASH $TECNICO_ADDRESS "TECNICO_SW"
verify_role $ESCUELA_ROLE_HASH $ESCUELA_ADDRESS "ESCUELA"

echo -e "${GREEN}✅ Configuración completada!${NC}"
echo -e "${YELLOW}Contrato: $CONTRACT_ADDRESS${NC}"
echo -e "${YELLOW}RPC URL: $RPC_URL${NC}"