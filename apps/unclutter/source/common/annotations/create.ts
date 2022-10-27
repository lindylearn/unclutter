import { getUrlHash } from "@unclutter/library-components/dist/common";
import { Annotation, Article } from "@unclutter/library-components/dist/store/_schema";

export function createDraftAnnotation(
    url: string,
    selector: object,
    reply_to: string = null
): LindyAnnotation {
    return createAnnotation(url, selector, {
        id: null,
        localId: generateId(),
        reply_to,
        isMyAnnotation: true,
    });
}

export function createLinkAnnotation(
    page_url: string,
    selector: object,
    article: Article
): LindyAnnotation {
    return createAnnotation(page_url, selector, {
        id: generateId(),
        platform: "info",
        article,
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
        localId: partial.localId || partial.id,
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
    platform: "h" | "hn" | "ll" | "info";
    link: string;
    created_at: string;
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

    // local state
    localId?: string; // immutable local annotation id (stays the same through remote synchronization)
    url: string;
    isMyAnnotation?: boolean;
    displayOffset?: number;
    displayOffsetEnd?: number;

    hidden?: boolean;
    focused?: boolean; // should only be set for one annotation

    // only for info annotations
    article?: Article;
}

export function hypothesisToLindyFormat(annotation: any, currentUsername: string): LindyAnnotation {
    const author: string = annotation.user.match(/([^:]+)@/)[1];
    return {
        id: annotation.id,
        url: annotation.uri,
        localId: annotation.id, // base comparisons on immutable localId
        author,
        isMyAnnotation: author === currentUsername,
        platform: "h",
        link: `https://hypothes.is/a/${annotation.id}`,
        created_at: annotation.created,
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
        article_id: getUrlHash(annotation.url),
        created_at: new Date(annotation.created_at).getTime() / 1000,
        quote_text: annotation.quote_text,
        text: annotation.text,
        tags: annotation.tags,
        quote_html_selector: annotation.quote_html_selector,
    };
}
export function unpickleLocalAnnotation(annotation: Annotation): LindyAnnotation {
    return createAnnotation(annotation.article_id, annotation.quote_html_selector, {
        ...annotation,
        created_at: new Date(annotation.created_at * 1000).toISOString(),
        isMyAnnotation: true,
    });
}
