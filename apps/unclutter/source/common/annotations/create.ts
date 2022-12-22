import { getUrlHash } from "@unclutter/library-components/dist/common";
import { Annotation, Article } from "@unclutter/library-components/dist/store/_schema";

export function createDraftAnnotation(
    url: string,
    selector: object,
    reply_to: string = null
): LindyAnnotation {
    return createAnnotation(url, selector, {
        id: generateId(),
        reply_to,
        isMyAnnotation: true,
    });
}

export function createInfoAnnotation(
    page_url: string,
    selector: object,
    article?: Article,
    relatedAnnotations?: LindyAnnotation[]
): LindyAnnotation {
    return createAnnotation(page_url, selector, {
        id: generateId(),
        platform: "info",
        article,
        relatedAnnotations,
    });
}

export function createAnnotation(
    url: string,
    selector: object,
    partial: Partial<LindyAnnotation> = {}
): LindyAnnotation {
    return {
        ...partial,
        id: partial.id,
        url,
        quote_text: selector?.[2]?.exact || "_",
        text: partial.text || "",
        author: partial.author || "",
        quote_html_selector: selector,
        platform: partial.platform || "ll",
        link: partial.id,
        reply_count: partial.reply_count || 0,

        isMyAnnotation: partial.isMyAnnotation || false,
        isPublic: false,
        upvote_count: 0,
        tags: partial.tags || [],
        created_at: partial.created_at || new Date().toISOString(),
        replies: [],
        user_upvoted: false,
        reply_to: partial.reply_to || null,
    };
}

export function generateId(): string {
    return Math.random().toString(36).slice(-10);
}

export interface LindyAnnotation {
    id: string;
    author: string;
    platform: "h" | "hn" | "ll" | "info" | "summary";
    link: string;
    created_at: string;
    updated_at?: string; // only set in remote fetch or data store
    reply_count: number;
    quote_text: string;
    text: string;
    replies: LindyAnnotation[];
    upvote_count: number;
    tags: string[];
    quote_html_selector: object;
    user_upvoted: boolean;
    isPublic: boolean;
    reply_to?: string;
    url: string; // page url or article id

    h_id?: string; // remote id if synced with hypothesis

    // local state
    isMyAnnotation?: boolean;
    displayOffset?: number;
    displayOffsetEnd?: number;

    hidden?: boolean;
    focused?: boolean; // should only be set for one annotation
    listIndex?: number;

    // only for info annotations
    article?: Article;
    relatedAnnotations?: LindyAnnotation[];
}

// TODO serialize to Annotation type directly
export function hypothesisToLindyFormat(annotation: any, currentUsername: string): LindyAnnotation {
    const author: string = annotation.user.match(/([^:]+)@/)[1];
    return {
        id: annotation.id,
        h_id: annotation.id,
        url: annotation.uri,
        author,
        isMyAnnotation: author === currentUsername,
        platform: "h",
        link: `https://hypothes.is/a/${annotation.id}`,
        created_at: annotation.created,
        updated_at: annotation.updated,
        reply_count: 0,
        quote_text: annotation.target?.[0].selector?.filter((s) => s.type == "TextQuoteSelector")[0]
            .exact,
        text: annotation.text,
        replies: [],
        upvote_count: 0,
        tags: annotation.tags,
        quote_html_selector: annotation.target[0].selector,
        user_upvoted: false,
        isPublic: annotation.permissions.read[0] === "group:__world__",
        reply_to: annotation.references?.[annotation.references.length - 1],
    };
}

// strip locally saved annotation from unneccessary state, to reduce used storage
export function pickleLocalAnnotation(annotation: LindyAnnotation): Annotation {
    return {
        id: annotation.id,
        h_id: annotation.h_id,
        article_id: annotation.url.startsWith("http") ? getUrlHash(annotation.url) : annotation.url,
        created_at: Math.round(new Date(annotation.created_at).getTime() / 1000),
        updated_at: annotation.updated_at
            ? Math.round(new Date(annotation.updated_at).getTime() / 1000)
            : undefined,
        quote_text: annotation.quote_text,
        text: annotation.text,
        tags: annotation.tags,
        quote_html_selector: annotation.quote_html_selector,
    };
}
export function unpickleLocalAnnotation(annotation: Annotation): LindyAnnotation {
    return createAnnotation(annotation.article_id, annotation.quote_html_selector, {
        ...annotation,
        h_id: annotation.h_id,
        created_at: new Date(annotation.created_at * 1000).toISOString(),
        updated_at: annotation.updated_at
            ? new Date(annotation.updated_at * 1000).toISOString()
            : undefined,
        isMyAnnotation: true,
    });
}
