import { z } from 'zod';

/** Body of POST /auth/login. Unknown fields are rejected. */
export const loginSchema = z
  .object({
    email: z.email({ message: 'Enter a valid email address' }).max(254),
    password: z.string().min(1, 'Enter your password').max(200),
  })
  .strict();

/** Body of POST /auth/change-password. Policy rules are checked by the service. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password').max(200),
    newPassword: z.string().min(1, 'Enter a new password').max(200),
  })
  .strict();

export type LoginBody = z.infer<typeof loginSchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;
