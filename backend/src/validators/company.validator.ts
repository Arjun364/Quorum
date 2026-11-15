import { z } from 'zod';

const email = z.email({ message: 'Enter a valid email address' }).max(254);
const name = (label: string) => z.string().trim().min(1, `Enter ${label}`).max(120);
const code = z.string().trim().min(1, 'Enter a code').max(12).regex(/^[A-Za-z0-9-]+$/, 'Use letters, digits and hyphens');

/** Body of POST /companies/signup. */
export const signupSchema = z
  .object({
    companyName: name('the company name'),
    slug: z.string().trim().toLowerCase().min(1, 'Choose a company address').max(40),
    name: name('your name'),
    jobTitle: z.string().trim().max(80).optional(),
    email,
    password: z.string().min(1, 'Enter a password').max(200),
  })
  .strict();

/** Query of GET /companies/slug-available. */
export const slugQuerySchema = z.object({ slug: z.string().trim().toLowerCase().max(60) });

/** Body of POST /auth/verify-email. */
export const verifyEmailSchema = z.object({ token: z.string().min(10).max(200) }).strict();

/** Body of POST /auth/resend-verification. */
export const resendVerificationSchema = z.object({ email }).strict();

/** Body of PUT /company/brand. */
export const brandSchema = z
  .object({
    name: name('the company name'),
    themePreset: z.enum(['Forest', 'Ocean', 'Graphite', 'Custom']),
    accentColor: z.string().trim().max(7).optional(),
  })
  .strict();

/** Body of PUT /company/logo (the image the browser just uploaded). */
export const logoSchema = z
  .object({ publicId: z.string().min(1).max(300), url: z.url().max(600) })
  .strict();

/** Body of POST /organizations and POST /organizations/:id/departments. */
export const nameAndCodeSchema = z.object({ name: name('a name'), code }).strict();

/** Body of PUT /organizations/:id and PUT /departments/:id. */
export const structureUpdateSchema = z
  .object({ name: name('a name').optional(), code: code.optional(), isActive: z.boolean().optional() })
  .strict();

/** Body of POST /departments/:id/head-invitation. */
export const inviteSchema = z.object({ name: name('the person’s name'), email }).strict();

/** Query of GET /invitations/lookup. */
export const tokenQuerySchema = z.object({ token: z.string().min(10).max(200) });

/** Body of POST /invitations/accept. */
export const acceptInvitationSchema = z
  .object({
    token: z.string().min(10).max(200),
    name: name('your name'),
    password: z.string().min(1, 'Enter a password').max(200),
  })
  .strict();

/** Route parameter that is a positive integer id. */
export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export type SignupBody = z.infer<typeof signupSchema>;
export type BrandBody = z.infer<typeof brandSchema>;
export type LogoBody = z.infer<typeof logoSchema>;
export type NameAndCodeBody = z.infer<typeof nameAndCodeSchema>;
export type StructureUpdateBody = z.infer<typeof structureUpdateSchema>;
export type InviteBody = z.infer<typeof inviteSchema>;
export type AcceptInvitationBody = z.infer<typeof acceptInvitationSchema>;