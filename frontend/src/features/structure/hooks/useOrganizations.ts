import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { structureApi } from '../api';
import type { NameAndCode } from '../types';
import { getStructureError } from '../utils';

/** Owns the organizations screen: the list and the dialog that creates a new organization. */
export function useOrganizations() {
  const queryClient = useQueryClient();

  // The list.
  const listQuery = useQuery({ queryKey: ['organizations'], queryFn: structureApi.listOrganizations });

  // Dialog state and the mutation that uses it.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createMutation = useMutation({
    mutationFn: (values: NameAndCode) => structureApi.createOrganization(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setDialogOpen(false);
    },
    onError: (e) => setError(getStructureError(e)),
  });

  /** Opens the new-organization dialog with a clean error state. */
  const openDialog = (): void => {
    setError(null);
    setDialogOpen(true);
  };

  /** Closes the dialog. */
  const closeDialog = (): void => setDialogOpen(false);

  /** Creates the organization from the dialog's values. */
  const handleCreate = (values: NameAndCode): void => {
    setError(null);
    createMutation.mutate(values);
  };

  return {
    organizations: listQuery.data ?? [],
    isLoading: listQuery.isPending,
    loadFailed: listQuery.isError,
    dialogOpen,
    error,
    isCreating: createMutation.isPending,
    openDialog,
    closeDialog,
    handleCreate,
  };
}