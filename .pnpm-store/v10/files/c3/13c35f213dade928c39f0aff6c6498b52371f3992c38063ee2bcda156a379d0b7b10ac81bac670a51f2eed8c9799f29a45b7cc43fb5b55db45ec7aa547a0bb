import z from 'zod';
import { ParamSchema } from './spec-helpers';

export const SnippetStainlessIslandPropsSchema = z.object({
  method: z.string(),
  path: z.string(),
  params: z.array(ParamSchema),
});
export type SnippetStainlessIslandProps = z.infer<typeof SnippetStainlessIslandPropsSchema>;
