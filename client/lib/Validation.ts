import { z } from "zod";

const cleanString = z.string().trim().min(1);

export const ApiArticleSchema = z
  .object({
    title: cleanString,
    text: cleanString,
    url: z.string().trim().url().optional(),
    image: z.string().trim().url().optional(),
    publish_date: cleanString,
    category: cleanString,
    summary: cleanString.optional(),
    language: z.literal("en"),
    source_country: cleanString,
  });

export const ApiArticlesResponseSchema = z.array(ApiArticleSchema);

export type ApiArticle = z.infer<typeof ApiArticleSchema>;
