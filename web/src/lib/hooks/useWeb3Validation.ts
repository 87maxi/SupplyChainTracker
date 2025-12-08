import { useState, useEffect } from 'react';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { toast } from 'sonner';
import { isAddress } from 'ethers';
import { EthereumProvider } from '@/lib/types';

export const useWeb3Validation = () => {
  const { address, isConnected, connectWallet, disconnectWallet, isLoading } = useWeb3();
  const [ready, setReady] = useState(false);
  const [validChain, setValidChain] = useState(true);
  const [validAddress, setValidAddress] = useState(false);

  useEffect(() => {
    const validateConnection = async () => {
      if (!isConnected || !isAddress(address)) {
        setReady(false);
        setValidAddress(false);
        return;
      }

      setValidAddress(true);

      try {
        // Access the provider directly to get chainId
        if (typeof window !== 'undefined' && (window as { ethereum?: EthereumProvider }).ethereum) {
          const chainId = await (window as { ethereum?: EthereumProvider }).ethereum!.request({ method: 'eth_chainId' }) as string;
          // Validar que la red sea la esperada (ajustar según tu contrato)
          const validChain = parseInt(chainId, 16) === 31337; // Red Anvil local
          
          setValidChain(validChain);
          setReady(validChain);
          
          if (!validChain) {
            toast.warning('Red incorrecta', {
              description: 'Conecta a la red local (Anvil) para continuar'
            });
          }
        }
      } catch (error) {
        console.error('Error validando la conexión', error);
        setReady(false);
      }
    };

    validateConnection();
  }, [isConnected, address]);

  const connectWeb3 = async () => {
    try {
      await connectWallet();
      return true;
    } catch (error) {
      toast.error('Error al conectar', {
        description: error instanceof Error ? error.message : 'Usuario rechazó la conexión'
      });
      return false;
    }
  };

  return {
    ready, // Si la conexión y red son válidas
    validChain,
    validAddress,
    address,
    isConnected,
    isLoading,
    connectWeb3,
    disconnect: disconnectWallet
  };
};