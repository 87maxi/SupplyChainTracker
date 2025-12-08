"use client";

import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { getRoleConstants } from '@/lib/services/Web3Service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { ethers } from 'ethers';
import { UserRoleStatus } from '@/lib/types';
import SupplyChainTrackerABI from '../../contracts/SupplyChainTrackerABI.json';

export function ContractDebug() {
  const { web3Service, address, isConnected, provider } = useWeb3();
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  interface ContractInfo {
    fabricanteRole?: string;
    hasDefaultAdminRole?: boolean | string;
    anvilAdminHasRole?: boolean | string;
    expectedAnvilAdmin?: string;
    addressMatchesAnvil?: boolean;
    directContractCall?: boolean | string;
    roleStatus?: string;
    requestRoleApprovalExists?: boolean;
    contractAddressValid?: boolean;
    expectedAdminAddress?: string;
    network?: {
      name: string;
      chainId: string;
    };
    contractDebugError?: string;
  }

  const testContractConnection = useCallback(async () => {
    if (!web3Service || !address) return;

    setLoading(true);
    setError(null);

    try {
      const info: ContractInfo = {};

      // Test basic contract connection
      try {
        info.fabricanteRole = getRoleConstants().FABRICANTE_ROLE;
      } catch (e) {
        info.fabricanteRole = 'Error getting role';
      }

      // Test hasRole function for DEFAULT_ADMIN_ROLE
      try {
        const adminRole = getRoleConstants().DEFAULT_ADMIN_ROLE;
        console.log('=== CONTRACT DEBUG ===');
        console.log('Contract address from env:', process.env.NEXT_PUBLIC_CONTRACT_ADDRESS);
        console.log('RPC URL from env:', process.env.NEXT_PUBLIC_RPC_URL);
        console.log('Web3Service instance:', !!web3Service);
        console.log('Testing hasRole for DEFAULT_ADMIN_ROLE:', adminRole);
        console.log('Testing with connected address:', address);
        console.log('Address is truthy:', !!address);

        if (!address) {
          info.hasDefaultAdminRole = 'No address connected';
          info.anvilAdminHasRole = 'No address connected';
          return;
        }

        const hasRole = await web3Service.hasRole(adminRole, address);
        console.log('Connected address hasRole result:', hasRole, 'Type:', typeof hasRole);
        info.hasDefaultAdminRole = hasRole;

        // Also test with the expected Anvil admin address
        const anvilAdmin = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
        console.log('Testing with Anvil admin address:', anvilAdmin);
        const anvilHasRole = await web3Service.hasRole(adminRole, anvilAdmin);
        console.log('Anvil admin hasRole result:', anvilHasRole, 'Type:', typeof anvilHasRole);
        info.anvilAdminHasRole = anvilHasRole;
        info.expectedAnvilAdmin = anvilAdmin;

        // Check if connected address matches Anvil admin
        info.addressMatchesAnvil = address?.toLowerCase() === anvilAdmin.toLowerCase();
        console.log('Address matches Anvil admin:', info.addressMatchesAnvil);
        console.log('Connected address lowercase:', address?.toLowerCase());
        console.log('Anvil admin lowercase:', anvilAdmin.toLowerCase());

        // Test direct contract call
        console.log('Testing direct contract call...');
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
          SupplyChainTrackerABI,
          provider
        );

        const directResult = await contract.hasRole(adminRole, anvilAdmin);
        console.log('Direct contract call result:', directResult, 'Type:', typeof directResult);
        info.directContractCall = directResult;

      } catch (e) {
        console.error('Error testing hasRole:', e);
        info.hasDefaultAdminRole = `Error: ${e instanceof Error ? e.message : 'Unknown'}`;
        info.anvilAdminHasRole = 'Error testing';
        info.directContractCall = 'Error testing';
      }

      // Test getRoleStatus function
      try {
        const status = await web3Service.getRoleStatus(getRoleConstants().FABRICANTE_ROLE, address);
        info.roleStatus = String(status);
      } catch (e) {
        info.roleStatus = `Error: ${e instanceof Error ? e.message : 'Unknown'}`;
      }

      // Test requestRoleApproval (dry run)
      try {
        // Don't actually call it, just check if the function exists
        info.requestRoleApprovalExists = typeof web3Service.requestRoleApproval === 'function';
      } catch (e) {
        info.requestRoleApprovalExists = false;
      }

      // Test contract address and basic connectivity
      try {
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        const adminRole = getRoleConstants().DEFAULT_ADMIN_ROLE;
        const anvilAdmin = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

        console.log('Contract debugging:');
        console.log('Contract address:', contractAddress);
        console.log('Admin role hash:', adminRole);
        console.log('Expected admin address:', anvilAdmin);
        console.log('Connected address:', address);

        // Test if contract address is valid
        info.contractAddressValid = ethers.isAddress(contractAddress || '');
        info.expectedAdminAddress = anvilAdmin;

        // Test network connectivity
        if (provider) {
          const network = await provider.getNetwork();
          info.network = {
            name: network.name,
            chainId: network.chainId.toString()
          };
        }

      } catch (e) {
        console.error('Error in contract debugging:', e);
        info.contractDebugError = `Error: ${e instanceof Error ? e.message : 'Unknown'}`;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [web3Service, address, provider]);

  useEffect(() => {
    if (isConnected && web3Service) {
      testContractConnection();
    }
  }, [isConnected, web3Service, address, testContractConnection]);

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p>Conecta tu wallet para hacer debug del contrato</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          Debug del Contrato
        </CardTitle>
        <CardDescription>
          Información de diagnóstico para solucionar problemas con el contrato
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={testContractConnection} disabled={loading}>
            {loading ? 'Probando...' : 'Probar Conexión'}
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              if (!window.ethereum) {
                alert('MetaMask no está instalado');
                return;
              }

              try {
                // Request connection to Anvil accounts
                const accounts = await window.ethereum.request({
                  method: 'eth_requestAccounts'
                });
                console.log('Connected to accounts:', accounts);

                // Switch to Anvil network if not already
                try {
                  await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x7A69' }], // 31337 in hex
                  });
                } catch (switchError: any) {
                  // If network doesn't exist, add it
                  if (switchError.code === 4902) {
                    await window.ethereum.request({
                      method: 'wallet_addEthereumChain',
                      params: [{
                        chainId: '0x7A69',
                        chainName: 'Anvil Localhost',
                        rpcUrls: ['http://localhost:8545'],
                        nativeCurrency: {
                          name: 'ETH',
                          symbol: 'ETH',
                          decimals: 18
                        }
                      }]
                    });
                  }
                }

                alert('Conectado a Anvil. Recarga la página para verificar los permisos.');
              } catch (error) {
                console.error('Error connecting to Anvil:', error);
                alert('Error al conectar a Anvil');
              }
            }}
          >
            Conectar a Anvil
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="font-medium text-red-800">Error de conexión:</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {contractInfo && (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Estado de Conexión</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Web3Service disponible:</span>
                    <Badge variant={web3Service ? "default" : "destructive"}>
                      {web3Service ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                      {web3Service ? 'Sí' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Dirección conectada:</span>
                    <span className="font-mono text-xs">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Configuración del Contrato</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Dirección válida:</span>
                    <Badge variant={contractInfo.contractAddressValid ? "default" : "destructive"}>
                      {contractInfo.contractAddressValid ? 'Sí' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Red:</span>
                    <Badge variant={contractInfo.network ? "default" : "destructive"}>
                      {contractInfo.network ? `${contractInfo.network.name} (${contractInfo.network.chainId})` : 'Error'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Admin esperado: {contractInfo.expectedAnvilAdmin}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium mb-2">Funciones del Contrato</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>hasRole:</span>
                    <Badge variant={typeof contractInfo.hasDefaultAdminRole === 'boolean' ? "default" : "destructive"}>
                      {typeof contractInfo.hasDefaultAdminRole === 'boolean' ? 'OK' : 'Error'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>getRoleStatus:</span>
                    <Badge variant={contractInfo.roleStatus && !contractInfo.roleStatus.startsWith('Error') ? "default" : "destructive"}>
                      {contractInfo.roleStatus && !contractInfo.roleStatus.startsWith('Error') ? 'OK' : 'Error'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>requestRoleApproval:</span>
                    <Badge variant={contractInfo.requestRoleApprovalExists ? "default" : "destructive"}>
                      {contractInfo.requestRoleApprovalExists ? 'OK' : 'Error'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium mb-2">Datos del Usuario</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Es Admin por defecto:</span>
                    <Badge variant={contractInfo.hasDefaultAdminRole === true ? "default" : contractInfo.hasDefaultAdminRole === false ? "secondary" : "destructive"}>
                      {contractInfo.hasDefaultAdminRole === true ? 'Sí' : contractInfo.hasDefaultAdminRole === false ? 'No' : 'Error'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Admin de Anvil tiene rol:</span>
                    <Badge variant={contractInfo.anvilAdminHasRole === true ? "default" : contractInfo.anvilAdminHasRole === false ? "secondary" : "destructive"}>
                      {contractInfo.anvilAdminHasRole === true ? 'Sí' : contractInfo.anvilAdminHasRole === false ? 'No' : 'Error'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Dirección = Admin Anvil:</span>
                    <Badge variant={contractInfo.addressMatchesAnvil ? "default" : "secondary"}>
                      {contractInfo.addressMatchesAnvil ? 'Sí' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Llamada directa al contrato:</span>
                    <Badge variant={contractInfo.directContractCall === true ? "default" : contractInfo.directContractCall === false ? "destructive" : "secondary"}>
                      {contractInfo.directContractCall === true ? 'Sí' : contractInfo.directContractCall === false ? 'No' : 'Error'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Admin esperado: {contractInfo.expectedAnvilAdmin}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Admin esperado: {contractInfo.expectedAnvilAdmin}
                  </div>
                  <div className="flex justify-between">
                    <span>Estado del rol FABRICANTE:</span>
                    <span className="text-xs">
                      {contractInfo.roleStatus?.state !== undefined ? `Estado ${contractInfo.roleStatus.state}` : 'No disponible'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer font-medium text-sm">Ver datos crudos</summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(contractInfo, null, 2)}
              </pre>
            </details>

            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium mb-2">Solicitudes Pendientes (Raw)</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  if (!web3Service) return;
                  try {
                    console.log('Fetching pending requests in debug...');
                    const requests = await web3Service.getAllPendingRoleRequests();
                    console.log('Debug requests:', requests);
                    alert(`Encontradas ${requests.length} solicitudes. Revisa la consola.`);
                  } catch (e) {
                    console.error('Debug error:', e);
                    alert('Error al buscar solicitudes: ' + (e instanceof Error ? e.message : String(e)));
                  }
                }}
              >
                Consultar Pendientes
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
