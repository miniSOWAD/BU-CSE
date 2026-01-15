import { z } from "zod";
export const noticeSchema = z.object({
  title: z.string().min(3),
  body: z.string().min(3),
  tags: z.array(z.string()).optional()
});
