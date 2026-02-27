import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WHITELIST_ETH } from '../config/spec';
import { supabase } from '../lib/supabase';
import {
  formatEthAmount,
  getConfiguredEthLockRecipient,
  getEthLockSubmission,
  requestEthLockVerification,
  submitAndRecordEthLock,
  type EthLockStatus,
  type EthLockSubmission,
} from '../lib/ethLock';

const ETH_LOCK_VERIFY_POLL_MS = 20_000;

interface UseEthLockResult {
  submission: EthLockSubmission | null;
  status: EthLockStatus;
  statusDetail: string;
  isLocked: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  isVerifying: boolean;
  error: string | null;
  lockAmountEth: number;
  lockAmountLabel: string;
  lockRecipient: string | null;
  refresh: () => Promise<void>;
  submitLock: () => Promise<boolean>;
  verifyLock: () => Promise<void>;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return 'ETH lock failed.';
}

function resolveLockRecipient(): string | null {
  try {
    return getConfiguredEthLockRecipient();
  } catch {
    return null;
  }
}

function getStatusDetail(
  status: EthLockStatus,
  submission: EthLockSubmission | null,
  error: string | null,
): string {
  if (error) {
    return error;
  }

  if (status === 'confirmed') {
    return 'ETH lock confirmed. Flux claims are enabled.';
  }

  if (status === 'error') {
    return submission?.lastError ?? 'ETH lock verification failed. Submit again to retry.';
  }

  if (submission?.status === 'confirmed' && submission.isLockActive === false) {
    return 'ETH lock override is disabled for testing. Submit again to retest this wallet.';
  }

  if (status === 'verifying') {
    return 'Verifying transaction on-chain. This updates automatically.';
  }

  if (status === 'sent') {
    return 'Transaction sent. Waiting for confirmation.';
  }

  return 'Lock ETH to unlock Flux claims.';
}

export function useEthLock(walletAddress: string | null): UseEthLockResult {
  const [submission, setSubmission] = useState<EthLockSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verifyInFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setSubmission(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const nextSubmission = await getEthLockSubmission(walletAddress);
      setSubmission(nextSubmission);
      setError(null);
    } catch (refreshError) {
      setSubmission(null);
      setError(toErrorMessage(refreshError));
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const triggerVerification = useCallback(async (txHashOverride?: string) => {
    if (!walletAddress) {
      return;
    }

    const targetTxHash = txHashOverride ?? submission?.txHash;
    if (!targetTxHash || verifyInFlightRef.current) {
      return;
    }

    verifyInFlightRef.current = true;
    setIsVerifying(true);

    try {
      const nextStatus = await requestEthLockVerification(walletAddress, targetTxHash);

      if (nextStatus) {
        setSubmission((current) => {
          if (!current) {
            return current;
          }

          if (current.status === nextStatus) {
            return current;
          }

          const nowIso = new Date().toISOString();

          return {
            ...current,
            status: nextStatus,
            isLockActive: nextStatus === 'confirmed' ? true : current.isLockActive,
            lastError: nextStatus === 'error' ? current.lastError : null,
            confirmedAt: nextStatus === 'confirmed' ? (current.confirmedAt ?? nowIso) : current.confirmedAt,
            updatedAt: nowIso,
          };
        });
      }

      await refresh();
      setError(null);
    } catch (verifyError) {
      setError(toErrorMessage(verifyError));
    } finally {
      verifyInFlightRef.current = false;
      setIsVerifying(false);
    }
  }, [refresh, submission?.txHash, walletAddress]);

  useEffect(() => {
    if (!walletAddress || !supabase) {
      return;
    }

    const supabaseClient = supabase;
    const normalizedWallet = walletAddress.toLowerCase();
    const channel = supabaseClient
      .channel(`eth-lock-submission:${normalizedWallet}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'eth_lock_submissions',
          filter: `wallet_address=eq.${normalizedWallet}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void refresh();
        }
      });

    return () => {
      void supabaseClient.removeChannel(channel);
    };
  }, [refresh, walletAddress]);

  useEffect(() => {
    if (!walletAddress || !submission?.txHash) {
      return;
    }

    if (submission.status !== 'sent' && submission.status !== 'verifying') {
      return;
    }

    void triggerVerification(submission.txHash);

    const timer = window.setInterval(() => {
      void triggerVerification(submission.txHash ?? undefined);
    }, ETH_LOCK_VERIFY_POLL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [submission?.status, submission?.txHash, triggerVerification, walletAddress]);

  const submitLock = useCallback(async (): Promise<boolean> => {
    if (!walletAddress || isSubmitting) {
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const nextSubmission = await submitAndRecordEthLock(walletAddress);
      setSubmission(nextSubmission);
      if (nextSubmission.txHash) {
        void triggerVerification(nextSubmission.txHash);
      }
      return true;
    } catch (submitError) {
      setError(toErrorMessage(submitError));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, triggerVerification, walletAddress]);

  const rawStatus = submission?.status ?? 'pending';
  const status: EthLockStatus =
    rawStatus === 'confirmed' && submission?.isLockActive === false
      ? 'pending'
      : rawStatus;

  const statusDetail = useMemo(
    () => getStatusDetail(status, submission, error),
    [error, status, submission],
  );

  return {
    submission,
    status,
    statusDetail,
    isLocked: status === 'confirmed',
    isLoading,
    isSubmitting,
    isVerifying,
    error,
    lockAmountEth: WHITELIST_ETH,
    lockAmountLabel: formatEthAmount(WHITELIST_ETH),
    lockRecipient: resolveLockRecipient(),
    refresh,
    submitLock,
    verifyLock: () => triggerVerification(),
  };
}
