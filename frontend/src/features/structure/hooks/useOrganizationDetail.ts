import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { structureApi } from '../api';
import type { Department, InvitePayload, NameAndCode } from '../types';
import { getStructureError } from '../utils';

/** Owns one organization's screen: its departments, the new-department dialog, and inviting, resending or revoking a head invitation. */
export function useOrganizationDetail() {
  // Route and cache dependencies.
  const organizationId = Number(useParams().id);
  const queryClient = useQueryClient();

  // Data: the organization (from the list) and its departments.
  const organizationsQuery = useQuery({ queryKey: ['organizations'], queryFn: structureApi.listOrganizations });
  const departmentsQuery = useQuery({
    queryKey: ['organizations', organizationId, 'departments'],
    queryFn: () => structureApi.listDepartments(organizationId),
    enabled: Number.isInteger(organizationId),
  });
  const organization = organizationsQuery.data?.find((o) => o.id === organizationId) ?? null;

  // Dialog state.
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [departmentError, setDepartmentError] = useState<string | null>(null);
  const [inviteTarget, setInviteTarget] = useState<Department | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  /** Reloads the departments and the organization counts after a change. */
  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['organizations'] });
  };

  // Mutations that use that state.
  const createDepartment = useMutation({
    mutationFn: (values: NameAndCode) => structureApi.createDepartment(organizationId, values),
    onSuccess: () => {
      refresh();
      setDepartmentDialogOpen(false);
    },
    onError: (e) => setDepartmentError(getStructureError(e)),
  });
  const inviteHead = useMutation({
    mutationFn: (values: InvitePayload) => structureApi.inviteHead(inviteTarget!.id, values),
    onSuccess: () => {
      refresh();
      setInviteTarget(null);
    },
    onError: (e) => setInviteError(getStructureError(e)),
  });
  const resend = useMutation({ mutationFn: structureApi.resendInvitation, onSuccess: refresh });
  const revoke = useMutation({ mutationFn: structureApi.revokeInvitation, onSuccess: refresh });

  /** Opens the new-department dialog. */
  const openDepartmentDialog = (): void => {
    setDepartmentError(null);
    setDepartmentDialogOpen(true);
  };

  /** Opens the invite dialog for one department. */
  const openInvite = (department: Department): void => {
    setInviteError(null);
    setInviteTarget(department);
  };

  return {
    organization,
    departments: departmentsQuery.data ?? [],
    isLoading: departmentsQuery.isPending || organizationsQuery.isPending,
    notFound: organizationsQuery.isSuccess && !organization,
    departmentDialogOpen,
    departmentError,
    isCreatingDepartment: createDepartment.isPending,
    inviteTarget,
    inviteError,
    isInviting: inviteHead.isPending,
    isBusy: resend.isPending || revoke.isPending,
    openDepartmentDialog,
    closeDepartmentDialog: () => setDepartmentDialogOpen(false),
    handleCreateDepartment: (values: NameAndCode) => {
      setDepartmentError(null);
      createDepartment.mutate(values);
    },
    openInvite,
    closeInvite: () => setInviteTarget(null),
    handleInvite: (values: InvitePayload) => {
      setInviteError(null);
      inviteHead.mutate(values);
    },
    handleResend: (invitationId: number) => resend.mutate(invitationId),
    handleRevoke: (invitationId: number) => revoke.mutate(invitationId),
  };
}