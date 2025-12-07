#!/bin/bash

# Script de deploy para SupplyChainTracker
# Despliega el contrato usando Foundry y configura la primera cuenta de anvil como admin

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Iniciando deploy del contrato SupplyChainTracker...${NC}"

# Verificar que Foundry esté instalado
if ! command -v forge &> /dev/null; then
    echo -e "${RED}Error: Foundry no está instalado. Instala Foundry primero.${NC}"
    exit 1
fi

# Verificar si anvil ya está ejecutándose
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}Anvil ya está ejecutándose en el puerto 8545${NC}"
    ANVIL_PID=$(lsof -ti:8545)
    echo -e "${YELLOW}PID de anvil: $ANVIL_PID${NC}"
else
    # Iniciar anvil en segundo plano
    echo -e "${YELLOW}Iniciando anvil (local blockchain)...${NC}"
    anvil --silent &
    ANVIL_PID=$!
    # Esperar a que anvil esté listo
    sleep 3
fi

# Configurar variables de entorno
export RPC_URL="http://localhost:8545"
export PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"  # Primera cuenta de anvil

# Compilar el contrato
echo -e "${YELLOW}Compilando contrato...${NC}"
forge build

# Desplegar el contrato
echo -e "${YELLOW}Desplegando contrato...${NC}"
DEPLOY_OUTPUT=$(forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast src/SupplyChainTracker.sol:SupplyChainTracker)

# Extraer la dirección del contrato desplegado
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "Deployed to:" | awk '{print $3}')

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo -e "${RED}Error: No se pudo extraer la dirección del contrato${NC}"
    echo "Output completo:"
    echo "$DEPLOY_OUTPUT"
    echo -e "${YELLOW}Intentando extraer dirección de forma alternativa...${NC}"
    CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -o '0x[a-fA-F0-9]\{40\}' | head -n 1)
    
    if [ -z "$CONTRACT_ADDRESS" ]; then
        echo -e "${RED}Error: No se pudo encontrar la dirección del contrato${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Contrato desplegado en: $CONTRACT_ADDRESS${NC}"

# Crear archivo de configuración con la dirección del contrato
cat > .env << EOF
RPC_URL=$RPC_URL
CONTRACT_ADDRESS=$CONTRACT_ADDRESS
ADMIN_PRIVATE_KEY=$PRIVATE_KEY
EOF

echo -e "${GREEN}✅ Archivo .env creado con la configuración${NC}"

# Mostrar información de las cuentas de anvil
echo -e "${YELLOW}Cuentas disponibles en anvil:${NC}"
curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_accounts","params":[],"id":1}' $RPC_URL | jq -r '.result[]'

echo -e "${GREEN}✅ Deploy completado exitosamente!${NC}"
echo -e "${YELLOW}Contrato: $CONTRACT_ADDRESS${NC}"
echo -e "${YELLOW}Anvil ejecutándose en PID: $ANVIL_PID${NC}"
echo -e "${YELLOW}Para detener anvil: kill $ANVIL_PID${NC}"

# Crear directorio scripts si no existe
mkdir -p scripts

# Script para interactuar con el contrato
cat > scripts/interact.sh << 'EOF'
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
EOF

chmod +x scripts/interact.sh

echo -e "${GREEN}✅ Script de interacción creado en scripts/interact.sh${NC}"
