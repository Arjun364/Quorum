import { useSession } from '@/features/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { peopleApi } from '../api';
import type { InvitePayload, Person } from '../types';
import { getPeopleError } from '../utils';

/** Owns a department's people screen: the list, inviting an employee, resending or revoking an invitation, deactivating a person and starting a move. */
export function useDepartmentPeople() {
  // Route, session and cache dependencies.
  const departmentId = Number(useParams().id);
  const { user } = useSession();
  const queryClient = useQueryClient();

  // The department's people.
  const peopleQuery = useQuery({
    queryKey: ['people', departmentId],
    queryFn: () => peopleApi.listPeople(departmentId),
    enabled: Number.isInteger(departmentId),
    retry: false,
  });

  // Dialog state.
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<Person | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Person | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['people'] });
    void queryClient.invalidateQueries({ queryKey: ['transfers'] });
    void queryClient.invalidateQueries({ queryKey: ['organizations'] });
  };

  // Destinations are only needed while the move dialog is open.
  const optionsQuery = useQuery({ queryKey: ['department-options'], queryFn: peopleApi.departmentOptions, enabled: moveTarget !== null });

  // Mutations that use that state.
  const invite = useMutation({
    mutationFn: (values: InvitePayload) => peopleApi.inviteEmployee(departmentId, values),
    onSuccess: () => {
      refresh();
      setInviteOpen(false);
      setNotice('Invitation sent. They get an email with a link that works once.');
    },
    onError: (e) => setInviteError(getPeopleError(e)),
  });
  const resend = useMutation({ mutationFn: peopleApi.resendInvitation, onSuccess: () => setNotice('A fresh link was sent.') });
  const revoke = useMutation({ mutationFn: peopleApi.revokeInvitation, onSuccess: refresh });
  const move = useMutation({
    mutationFn: (toDepartmentId: number) => peopleApi.requestTransfer({ userId: moveTarget!.id, toDepartmentId }),
    onSuccess: (transfer) => {
      refresh();
      setMoveTarget(null);
      setNotice(transfer.status === 'Completed' ? `${transfer.person.name} has moved to ${transfer.to.name}.` : `Move requested. It completes when ${transfer.missing.length === 1 ? 'one more person agrees' : 'everyone agrees'}.`);
    },
    onError: (e) => setMoveError(getPeopleError(e)),
  });
  const deactivate = useMutation({
    mutationFn: () => peopleApi.deactivate(deactivateTarget!.id),
    onSuccess: (person) => {
      refresh();
      setDeactivateTarget(null);
      setNotice(`${person.name} is now inactive. Their history stays.`);
    },
    onError: (e) => setDeactivateError(getPeopleError(e)),
  });

  const options = (optionsQuery.data ?? []).filter((d) => d.id !== departmentId);

  return {
    data: peopleQuery.data ?? null,
    isLoading: peopleQuery.isPending,
    loadFailed: peopleQuery.isError,
    selfId: user?.id ?? null,
    notice,
    dismissNotice: () => setNotice(null),
    isBusy: resend.isPending || revoke.isPending,
    inviteOpen,
    inviteError,
    isInviting: invite.isPending,
    openInvite: () => {
      setInviteError(null);
      setInviteOpen(true);
    },
    closeInvite: () => setInviteOpen(false),
    handleInvite: (values: InvitePayload) => {
      setInviteError(null);
      invite.mutate(values);
    },
    handleResend: (id: number) => resend.mutate(id),
    handleRevoke: (id: number) => revoke.mutate(id),
    moveTarget,
    moveError,
    moveOptions: options,
    isMoving: move.isPending,
    openMove: (person: Person) => {
      setMoveError(null);
      setMoveTarget(person);
    },
    closeMove: () => setMoveTarget(null),
    handleMove: (toDepartmentId: number) => {
      setMoveError(null);
      move.mutate(toDepartmentId);
    },
    departmentId,
    deactivateTarget,
    deactivateError,
    isDeactivating: deactivate.isPending,
    openDeactivate: (person: Person) => {
      setDeactivateError(null);
      setDeactivateTarget(person);
    },
    closeDeactivate: () => setDeactivateTarget(null),
    handleDeactivate: () => {
      setDeactivateError(null);
      deactivate.mutate();
    },
  };
}