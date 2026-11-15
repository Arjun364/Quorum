import { createHash } from 'node:crypto';
import { CLOUDINARY_ROOT_FOLDER } from '../constants';

/** Cloudinary account settings; all three are needed to sign uploads. */
export interface CloudinaryConfig {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
}

/** What the browser needs to upload one image straight to Cloudinary (the secret never leaves the server). */
export interface UploadSignature {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

/** True when all three Cloudinary settings are present. */
export function isCloudinaryConfigured(config: CloudinaryConfig): config is Required<CloudinaryConfig> {
  return Boolean(config.cloudName && config.apiKey && config.apiSecret);
}

/** Folder that holds one company's images of one kind ("quorum/acme/logo"). */
export function companyFolder(slug: string, kind: 'logo' | 'avatars'): string {
  return `${CLOUDINARY_ROOT_FOLDER}/${slug}/${kind}`;
}

/** Signs an upload into `folder`: SHA-1 over the sorted parameters followed by the API secret, as Cloudinary specifies. */
export function createUploadSignature(config: Required<CloudinaryConfig>, folder: string, now: Date = new Date()): UploadSignature {
  const timestamp = Math.floor(now.getTime() / 1000);
  const toSign = `folder=${folder}&timestamp=${timestamp}${config.apiSecret}`;
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    apiKey: config.apiKey,
    timestamp,
    folder,
    signature: createHash('sha1').update(toSign).digest('hex'),
  };
}

/** True when an uploaded image really sits in this account and in the expected folder (so one company cannot point at another's image). */
export function isOwnImage(config: Required<CloudinaryConfig>, folder: string, publicId: string, url: string): boolean {
  return (
    publicId.startsWith(`${folder}/`) &&
    !publicId.includes('..') &&
    url.startsWith(`https://res.cloudinary.com/${config.cloudName}/image/upload/`) &&
    url.includes(publicId)
  );
}
