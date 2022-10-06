import { entitySchema } from "@rocicorp/rails";
import { z } from "zod";

// *** Article ***
export const articleSchema = entitySchema.extend({
    url: z.string(),
    title: z.nullable(z.string()),
    word_count: z.number(),
    publication_date: z.nullable(z.string()),

    time_added: z.number(), // unix seconds, 0 for missing value
    reading_progress: z.number(),
    is_favorite: z.boolean(),

    topic_id: z.nullable(z.string()),

    recency_sort_position: z.optional(z.number()),
    topic_sort_position: z.optional(z.number()),
    favorites_sort_position: z.optional(z.nullable(z.number())),
});
export type Article = z.infer<typeof articleSchema>;
export const readingProgressFullClamp = 0.95;

// *** Topic ***
export const topicSchema = entitySchema.extend({
    name: z.string(),
    emoji: z.nullable(z.string()),

    group_id: z.nullable(z.string()),
});
export type Topic = z.infer<typeof topicSchema>;

// *** Setting ***
export const settingsSchema = z.object({
    tutorial_stage: z.optional(z.number()),
});
export type Settings = z.infer<typeof settingsSchema>;

// *** ArticleText ***
export const articleTextSchema = entitySchema.extend({
    title: z.nullable(z.string()),
    paragraphs: z.array(z.string()),
});
export type ArticleText = z.infer<typeof articleTextSchema>;

// *** ArticleLink ***
export const articleLinkSchema = entitySchema.extend({
    source: z.string(),
    target: z.string(),
    type: z.enum(["sim"]),
    score: z.optional(z.number()),
});
export type ArticleLink = z.infer<typeof articleLinkSchema>;

// *** PartialSyncState ***
export const PARTIAL_SYNC_STATE_KEY = "control/partialSync";
export const partialSyncStateSchema = z.union([
    z.object({
        // full-text entries may lag behind article version
        minVersion: z.number(),
        maxVersion: z.number(),
        endKey: z.string(),
    }),
    z.literal("PARTIAL_SYNC_COMPLETE"),
]);
export type PartialSyncState = z.TypeOf<typeof partialSyncStateSchema>;
