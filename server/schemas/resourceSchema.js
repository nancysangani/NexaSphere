import { z } from 'zod';
import { sanitizeText } from '../utils/sanitize.js';

const tagsSchema = z.union([z.array(z.string().max(40)), z.string()]).transform((val) => {
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12);
  }
  return val.slice(0, 12);
});

const resourceBaseSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1).max(5000).optional().default(''),
  file_url: z.string().trim().min(1).max(2048),
  file_type: z.string().trim().max(50).optional(),
  file_size: z.number().int().positive().optional(),
  category: z
    .enum([
      'study_material',
      'project_template',
      'notes',
      'past_papers',
      'recorded_sessions',
      'other',
    ])
    .optional()
    .default('other'),
  tags: tagsSchema.optional().default([]),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  uploaded_by: z.string().trim().max(255).optional(),
});

export const createResourceSchema = resourceBaseSchema.transform((data) => ({
  ...data,
  title: sanitizeText(data.title, 255),
  description: sanitizeText(data.description, 5000),
}));

export const updateResourceSchema = resourceBaseSchema.partial().transform((data) => {
  const result = { ...data };
  if (result.title) result.title = sanitizeText(result.title, 255);
  if (result.description) result.description = sanitizeText(result.description, 5000);
  return result;
});

export const paginationSchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((v) => Math.max(1, parseInt(v, 10) || 1)),
    limit: z
      .string()
      .optional()
      .transform((v) => Math.min(100, Math.max(1, parseInt(v, 10) || 20))),
    category: z.string().optional(),
    difficulty: z.string().optional(),
    status: z.string().optional(),
    q: z.string().optional(),
  })
  .passthrough();

export const voteSchema = z.object({
  voter_id: z.string().trim().min(1).max(255),
});
