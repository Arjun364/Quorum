import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { peopleApi } from '../api';
import type { Transfer } from '../types';
import { getPeopleError } from '../utils';

/** Owns the moves screen: the list of moves the viewer is concerned with, approving, declining (with a note) and withdrawing. */
export function useTransfers() {
  const queryClient = useQueryClient();
  const listQuery = useQuery({ queryKey: ['transfers'], queryFn: peopleApi.listTransfers });
  const [declineTarget, setDeclineTarget] = useState<Transfer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['transfers'] });
    void queryClient.invalidateQueries({ queryKey: ['people'] });
  };
  const onError = (e: unknown): void => setError(getPeopleError(e));

  const approve = useMutation({ mutationFn: peopleApi.approveTransfer, onSuccess: () => { setError(null); refresh(); }, onError });
  const cancel = useMutation({ mutationFn: peopleApi.cancelTransfer, onSuccess: () => { setError(null); refresh(); }, onError });
  const decline = useMutation({
    mutationFn: (note: string) => peopleApi.rejectTransfer(declineTarget!.id, note),
    onSuccess: () => {
      setError(null);
      setDeclineTarget(null);
      refresh();
    },
    onError,
  });

  const transfers = listQuery.data ?? [];
  return {
    waiting: transfers.filter((t) => t.status === 'Pending'),
    history: transfers.filter((t) => t.status !== 'Pending'),
    isLoading: listQuery.isPending,
    loadFailed: listQuery.isError,
    error,
    isBusy: approve.isPending || cancel.isPending,
    declineTarget,
    isDeclining: decline.isPending,
    handleApprove: (id: number) => approve.mutate(id),
    handleCancel: (id: number) => cancel.mutate(id),
    openDecline: (transfer: Transfer) => setDeclineTarget(transfer),
    closeDecline: () => setDeclineTarget(null),
    handleDecline: (note: string) => decline.mutate(note),
  };
}