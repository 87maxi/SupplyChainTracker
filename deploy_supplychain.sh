#!/bin/bash

# Script de deploy para SupplyChainTracker
# Ejecuta el script de Solidity desde fuera del workspace sc

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Iniciando deploy del contrato SupplyChainTracker...${NC}"

# Verificar que Foundry esté instalado
if ! command -v forge &> /dev/null; then
    echo -e "${RED}Error: Foundry no está instalado. Instala Foundry primero.${NC}"
    exit 1
fi

# Cambiar al directorio del proyecto
cd sc

echo -e "${YELLOW}📦 Compilando contrato...${NC}"
forge build

# Verificar si anvil está ejecutándose, si no, iniciarlo
if ! lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}🔥 Iniciando anvil (local blockchain)...${NC}"
    anvil --silent &
    ANVIL_PID=$!
    sleep 3
    echo -e "${YELLOW}📝 Anvil ejecutándose en PID: $ANVIL_PID${NC}"
else
    echo -e "${YELLOW}📝 Anvil ya está ejecutándose${NC}"
    ANVIL_PID=$(lsof -ti:8545)
fi

export RPC_URL="http://localhost:8545"

echo -e "${YELLOW}🚀 Desplegando contrato con script de Solidity...${NC}"

# Ejecutar el script de deploy de Foundry
DEPLOY_OUTPUT=$(forge script script/DeployBasic.s.sol:DeployBasic \
    --rpc-url $RPC_URL \
    --broadcast \
    --skip-simulation \
    -vv)

# Extraer la dirección del contrato desplegado
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "Contrato desplegado en:" | awk '{print $4}')

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo -e "${RED}Error: No se pudo extraer la dirección del contrato${NC}"
    echo "Output completo:"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

echo -e "${GREEN}✅ Contrato desplegado en: $CONTRACT_ADDRESS${NC}"

# Crear archivo de configuración
cat > ../deployment.env << EOF
RPC_URL=$RPC_URL
CONTRACT_ADDRESS=$CONTRACT_ADDRESS
ADMIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
EOF

echo -e "${GREEN}📁 Archivo de configuración creado: deployment.env${NC}"

echo -e "${GREEN}🎉 Deploy completado exitosamente!${NC}"
echo -e "${YELLOW}📋 Resumen:"
echo -e "   Contrato: $CONTRACT_ADDRESS"
echo -e "   RPC: $RPC_URL"
echo -e "   Admin: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo -e "   Anvil PID: $ANVIL_PID${NC}"

# Volver al directorio original
cd ..

echo -e "${GREEN}✅ Para interactuar con el contrato, usa el archivo deployment.env${NC}"