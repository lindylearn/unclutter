import axios from "axios";

export function createDraftAnnotation(url, selector) {
  return {
    id: "draft",
    url,
    quote_text: selector?.[2].exact,
    text: "",
    author: { username: "" },
    quote_html_selector: selector,
    platform: "ll",
    link: Math.random().toString(36).slice(-5),
    reply_count: null,
    is_draft: true,
  };
}
