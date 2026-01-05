import { z } from 'zod';

export const profileSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  avatar_url: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ProfileDto = z.infer<typeof profileSchema>;

export function parseProfile(dto: unknown): ProfileDto {
  return profileSchema.parse(dto);
}
