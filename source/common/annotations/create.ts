export function createDraftAnnotation(
    url: string,
    selector: object
): LindyAnnotation {
    return createAnnotation(url, selector, {});
}

function createAnnotation(
    url: string,
    selector: object,
    partial: Partial<LindyAnnotation> = {}
): LindyAnnotation {
    const id = partial.id || `draft_${Math.random().toString(36).slice(-5)}`;
    return {
        id: id,
        localId: id,
        url,
        quote_text: selector?.[2]?.exact || "_",
        text: partial.text || "",
        author: partial.author || { username: "" },
        quote_html_selector: selector,
        platform: partial.platform || "ll",
        link: id,
        reply_count: partial.reply_count || null,

        is_draft: partial.is_draft || true,
        isMyAnnotation: true,
        isPublic: false,
        upvote_count: 0,
        tags: partial.tags || [],
        created_at: partial.created_at || new Date().toISOString(),
        replies: [],
        user_upvoted: false,
    };
}

export interface LindyAnnotation {
    id: string;
    author: { username: string };
    platform: "h" | "hn" | "ll";
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

    // local state
    is_draft?: boolean; // created highlight but not yet shown in sidebar
    localId?: string; // local id until synced
    url?: string;
    isMyAnnotation?: boolean;
    displayOffset?: number;

    focused?: boolean; // should only be set for one annotation
}

export function hypothesisToLindyFormat(annotation): LindyAnnotation {
    return {
        id: annotation.id,
        author: annotation.user.match(/([^:]+)@/)[1],
        platform: "h",
        link: `https://hypothes.is/a/${annotation.id}`,
        created_at: annotation.created,
        reply_count: 0,
        quote_text: annotation.target?.[0].selector?.filter(
            (s) => s.type == "TextQuoteSelector"
        )[0].exact,
        text: annotation.text,
        replies: [],
        upvote_count: 0,
        tags: annotation.tags,
        quote_html_selector: annotation.target[0].selector,
        user_upvoted: false,
        isPublic: annotation.permissions.read[0] === "__world__",
    };
}

export interface PickledAnnotation {
    url: string;
    id: string;
    created_at: string;
    quote_text: string;
    text: string;
    tags: string[];
    quote_html_selector: object;
}

// strip locally saved annotation from unneccessary state, to reduce used storage
export function pickleLocalAnnotation(
    annotation: LindyAnnotation
): PickledAnnotation {
    return {
        url: annotation.url,
        id: annotation.id,
        created_at: annotation.created_at,
        quote_text: annotation.quote_text,
        text: annotation.text,
        tags: annotation.tags,
        quote_html_selector: annotation.quote_html_selector,
    };
}
export function unpickleLocalAnnotation(
    annotation: PickledAnnotation
): LindyAnnotation {
    return createAnnotation(
        annotation.url,
        annotation.quote_html_selector,
        annotation
    );
}
