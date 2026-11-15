import { SystemRole, UserStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  approvalNeeds,
  approvalsAvailableTo,
  canStartTransfer,
  emptyApprovals,
  isFullyApproved,
  missingApprovals,
  transferBlocker,
  withApproval,
  type DepartmentFacts,
  type PersonFacts,
} from '../src/services/rules';

const qa: DepartmentFacts = { id: 1, organizationId: 5, headUserId: 100 };
const production: DepartmentFacts = { id: 2, organizationId: 5, headUserId: 200 };
const headOffice: DepartmentFacts = { id: 3, organizationId: 6, headUserId: 300 };
const headless: DepartmentFacts = { id: 4, organizationId: 5, headUserId: null };
const person: PersonFacts = { id: 7, systemRole: SystemRole.Employee, status: UserStatus.Active, departmentId: 1 };

describe('transferBlocker', () => {
  it('lets an active employee move to another department', () => {
    expect(transferBlocker(person, qa, production)).toBeNull();
  });
  it('blocks a department head until a replacement is named', () => {
    const head: PersonFacts = { ...person, id: 100, systemRole: SystemRole.DepartmentHead };
    expect(transferBlocker(head, qa, production)).toMatch(/replacement/);
  });
  it('blocks the person who is recorded as the department head even if the role looks like an employee', () => {
    expect(transferBlocker({ ...person, id: 100 }, qa, production)).toMatch(/replacement/);
  });
  it('blocks inactive people', () => {
    expect(transferBlocker({ ...person, status: UserStatus.Inactive }, qa, production)).toMatch(/active/);
  });
  it('blocks a move to the same department', () => {
    expect(transferBlocker(person, qa, qa)).toMatch(/already/);
  });
  it('blocks a move that starts from a department the person is not in', () => {
    expect(transferBlocker({ ...person, departmentId: 2 }, qa, production)).toMatch(/not in the department/);
  });
});

describe('approvalNeeds', () => {
  it('needs both heads inside one organization', () => {
    expect(approvalNeeds(qa, production)).toEqual({ needFromHead: true, needToHead: true, needCompanyHead: false });
  });
  it('adds the company head across organizations', () => {
    expect(approvalNeeds(qa, headOffice).needCompanyHead).toBe(true);
  });
  it('asks the company head to stand in when a department has no head', () => {
    expect(approvalNeeds(qa, headless)).toEqual({ needFromHead: true, needToHead: false, needCompanyHead: true });
  });
});

describe('who may act', () => {
  it('lets the head of either department start and approve for their own side', () => {
    const fromHead = { id: 100, systemRole: SystemRole.DepartmentHead };
    const toHead = { id: 200, systemRole: SystemRole.DepartmentHead };
    expect(approvalsAvailableTo(fromHead, qa, production)).toEqual(['FromHead']);
    expect(approvalsAvailableTo(toHead, qa, production)).toEqual(['ToHead']);
    expect(canStartTransfer(fromHead, qa, production)).toBe(true);
  });
  it('keeps an unrelated head out', () => {
    const stranger = { id: 999, systemRole: SystemRole.DepartmentHead };
    expect(canStartTransfer(stranger, qa, production)).toBe(false);
    expect(approvalsAvailableTo(stranger, qa, production)).toEqual([]);
  });
  it('lets the company head start, but only approve as company head', () => {
    const ceo = { id: 1, systemRole: SystemRole.CompanyHead };
    expect(canStartTransfer(ceo, qa, production)).toBe(true);
    expect(approvalsAvailableTo(ceo, qa, production)).toEqual(['CompanyHead']);
  });
  it('gives employees nothing', () => {
    expect(canStartTransfer({ id: 7, systemRole: SystemRole.Employee }, qa, production)).toBe(false);
  });
});

describe('approval state', () => {
  it('completes only when every needed approval is in', () => {
    let state = emptyApprovals(approvalNeeds(qa, headOffice));
    expect(missingApprovals(state)).toEqual(['FromHead', 'ToHead', 'CompanyHead']);
    state = withApproval(state, 'FromHead');
    state = withApproval(state, 'ToHead');
    expect(isFullyApproved(state)).toBe(false);
    state = withApproval(state, 'CompanyHead');
    expect(isFullyApproved(state)).toBe(true);
  });
  it('ignores an approval nobody asked for', () => {
    const state = withApproval(emptyApprovals(approvalNeeds(qa, production)), 'CompanyHead');
    expect(state.companyHeadApproved).toBe(false);
    expect(missingApprovals(state)).toEqual(['FromHead', 'ToHead']);
  });
});