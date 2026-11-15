import type { Company, User } from '@prisma/client';
import type { AppConfig } from '../config';
import { companyFolder, createUploadSignature, isCloudinaryConfigured, isOwnImage, type UploadSignature } from '../helpers';
import type { PeopleRepositoryContract } from '../types';
import { badRequest, notFound, serviceUnavailable } from '../utils';
import type { AuditService } from './audit.service';

/** A person's own profile. */
export interface ProfileResponse {
  id: number;
  name: string;
  email: string;
  jobTitle: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

/** Fields a person can change about themselves. */
export interface ProfileUpdate {
  name: string;
  jobTitle: string | null;
  phone: string | null;
}

const toProfile = (user: User): ProfileResponse => ({
  id: user.id,
  name: user.name,
  email: user.email,
  jobTitle: user.jobTitle,
  phone: user.phone,
  avatarUrl: user.avatarUrl,
});

/** Dependencies of the profile service. */
export interface ProfileServiceDeps {
  people: PeopleRepositoryContract;
  audit: AuditService;
  config: Pick<AppConfig, 'cloudinary'>;
}

/** A person's own profile: name, job title, phone and photo. The email is fixed by the invitation and cannot be changed here. */
export class ProfileService {
  constructor(private readonly deps: ProfileServiceDeps) {}

  /** Returns the signed-in person's profile. */
  async get(companyId: number, userId: number): Promise<ProfileResponse> {
    const user = await this.deps.people.findInCompany(companyId, userId);
    if (!user) throw notFound('Person not found');
    return toProfile(user);
  }

  /** Saves the person's own details. */
  async update(companyId: number, userId: number, input: ProfileUpdate): Promise<ProfileResponse> {
    const user = await this.deps.people.updateProfile(companyId, userId, { name: input.name.trim(), jobTitle: input.jobTitle?.trim() || null, phone: input.phone?.trim() || null });
    await this.deps.audit.log({ userId, companyId, action: 'ProfileUpdated', entityType: 'User', entityId: userId });
    return toProfile(user);
  }

  /** Signs one upload into this company's avatar folder; the browser then uploads straight to the image service. */
  createAvatarSignature(company: Company): UploadSignature {
    const cloudinary = this.deps.config.cloudinary;
    if (!isCloudinaryConfigured(cloudinary)) throw serviceUnavailable('Image uploads are not set up yet');
    return createUploadSignature(cloudinary, companyFolder(company.slug, 'avatars'));
  }

  /** Saves an uploaded photo after checking it sits in this company's avatar folder. */
  async setAvatar(company: Company, userId: number, input: { publicId: string; url: string }): Promise<ProfileResponse> {
    const cloudinary = this.deps.config.cloudinary;
    if (!isCloudinaryConfigured(cloudinary)) throw serviceUnavailable('Image uploads are not set up yet');
    if (!isOwnImage(cloudinary, companyFolder(company.slug, 'avatars'), input.publicId, input.url)) {
      throw badRequest('That image does not belong to your company’s photo folder.');
    }
    const user = await this.deps.people.setAvatar(company.id, userId, { avatarUrl: input.url, avatarPublicId: input.publicId });
    await this.deps.audit.log({ userId, companyId: company.id, action: 'AvatarUpdated', entityType: 'User', entityId: userId });
    return toProfile(user);
  }

  /** Removes the person's photo. */
  async removeAvatar(companyId: number, userId: number): Promise<ProfileResponse> {
    const user = await this.deps.people.setAvatar(companyId, userId, { avatarUrl: null, avatarPublicId: null });
    await this.deps.audit.log({ userId, companyId, action: 'AvatarRemoved', entityType: 'User', entityId: userId });
    return toProfile(user);
  }
}