"use client";

import { useState } from "react";

/**
 * @description Hook for managing Web3 transaction states and errors.
 * @returns An object with loading state, error, and a function to execute transactions.
 */
export const useWeb3 = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * @description Executes a Web3 transaction and handles loading/error states.
   * @param txPromise A promise representing the transaction.
   * @returns The transaction hash if successful.
   */
  const executeTx = async (txPromise: Promise<any>): Promise<string> => {
    setIsLoading(true);
    setError(null);
    try {
      const tx = await txPromise;
      await tx.wait(); // Wait for transaction confirmation
      return tx.hash;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, executeTx };
};
