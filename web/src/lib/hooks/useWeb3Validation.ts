import { useEffect, useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { toast } from 'sonner';

// Custom hook to validate web3 connection and network
export const useWeb3Validation = () => {
  const { provider, chainId } = useWeb3();
  const [isNetworkValid, setIsNetworkValid] = useState<boolean | null>(null);

  useEffect(() => {
    const validateNetwork = async () => {
      if (!provider || chainId === null) {
        setIsNetworkValid(null);
        return;
      }

      try {
        // Get the actual network from the provider
        const network = await provider.getNetwork();
        const expectedChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337');
        
        if (network.chainId !== expectedChainId) {
          const message = `Red incorrecta. Por favor, cambie a la red local (Chain ID: ${expectedChainId}) o a la red configurada.`;
          toast.error('Red Incorrecta', {
            description: message,
            duration: 10000,
            dismissible: true
          });
          setIsNetworkValid(false);
        } else {
          setIsNetworkValid(true);
        }
      } catch (error) {
        console.error('Error validating network:', error);
        toast.error('Error de conexión', {
          description: 'No se pudo validar la red. Verifica tu conexión a internet y la configuración de tu wallet.',
          duration: 10000,
          dismissible: true
        });
        setIsNetworkValid(false);
      }
    };

    validateNetwork();
  }, [provider, chainId]);

  return { isNetworkValid };
};