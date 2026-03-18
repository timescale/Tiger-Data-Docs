/**
 * Split-button + dropdown: Copy Markdown, Open in Claude / ChatGPT / Cursor,
 * View as Markdown. Matches Stainless-style docs UX (LLM-friendly page markdown).
 *
 * Expects `markdownUrl` (e.g. https://site.com/path/to/page.md) from the server.
 */
import { useState, useCallback, useRef, useEffect } from "react";

export interface DocMarkdownActionsProps {
  /** Full URL to the page’s raw markdown (pathname + ".md"). */
  markdownUrl: string;
  /** Human-readable page URL for fallback prompts. */
  pageUrl?: string;
}

async function fetchMarkdown(url: string): Promise<string> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

const IconCopy = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M5.5 4.5V11.5C5.5 12.05 5.95 12.5 6.5 12.5H11.5C12.05 12.5 12.5 12.05 12.5 11.5V4.5C12.5 3.95 12.05 3.5 11.5 3.5H6.5C5.95 3.5 5.5 3.95 5.5 4.5Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.5 2.5V9.5C3.5 10.05 3.95 10.5 4.5 10.5H10"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconExternal = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
    <path
      d="M5 2.5H3C2.45 2.5 2 2.95 2 3.5V11C2 11.55 2.45 12 3 12H10.5C11.05 12 11.5 11.55 11.5 11V9M8 2.5H12M12 2.5V6.5M12 2.5L5.5 9"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconChevron = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 7.5L6 4.5L9 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconClaude = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path
      d="M10 2L12.5 7.5L18 10L12.5 12.5L10 18L7.5 12.5L2 10L7.5 7.5L10 2Z"
      fill="#CC785C"
    />
  </svg>
);

const IconChatGPT = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path
      d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM10 16C6.69 16 4 13.31 4 10C4 6.69 6.69 4 10 4C13.31 4 16 6.69 16 10C16 13.31 13.31 16 10 16Z"
      fill="#0D0D0D"
    />
    <path
      d="M10 6C8.34 6 7 7.34 7 9C7 10.66 8.34 12 10 12C11.66 12 13 10.66 13 9C13 7.34 11.66 6 10 6Z"
      fill="#0D0D0D"
    />
  </svg>
);

const IconCursor = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path d="M4 4L16 4L16 16L4 16L4 4Z" stroke="#0D0D0D" strokeWidth="2" fill="none" />
    <path d="M8 8L12 12M12 8L8 12" stroke="#0D0D0D" strokeWidth="1.5" />
  </svg>
);

const IconMd = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
    <path d="M5 5V11M5 8L7 5L9 8V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11 5V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const CLAUDE_URL = "https://claude.ai/new";
const CHATGPT_URL = "https://chatgpt.com/";
export default function DocMarkdownActions({ markdownUrl, pageUrl }: DocMarkdownActionsProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const copyMarkdown = useCallback(async () => {
    setBusy(true);
    try {
      const md = await fetchMarkdown(markdownUrl);
      await navigator.clipboard.writeText(md);
      showToast("Markdown copied to clipboard");
      setOpen(false);
    } catch {
      showToast("Couldn’t load markdown. Is this page available as .md?");
    } finally {
      setBusy(false);
    }
  }, [markdownUrl, showToast]);

  const openInAssistant = useCallback(
    async (target: "claude" | "chatgpt" | "cursor") => {
      setBusy(true);
      try {
        const md = await fetchMarkdown(markdownUrl);
        await navigator.clipboard.writeText(md);
        if (target === "claude") {
          window.open(CLAUDE_URL, "_blank", "noopener,noreferrer");
        } else if (target === "chatgpt") {
          window.open(CHATGPT_URL, "_blank", "noopener,noreferrer");
        } else {
          window.open("https://cursor.com", "_blank", "noopener,noreferrer");
        }
        showToast("Markdown copied — paste in the new tab if needed");
        setOpen(false);
      } catch {
        const fallback = pageUrl ?? markdownUrl.replace(/\.md$/, "");
        const msg = `Read this documentation page and help me:\n${fallback}`;
        try {
          await navigator.clipboard.writeText(msg);
          if (target === "claude") window.open(CLAUDE_URL, "_blank", "noopener,noreferrer");
          else if (target === "chatgpt") window.open(CHATGPT_URL, "_blank", "noopener,noreferrer");
          else window.open("https://cursor.com", "_blank", "noopener,noreferrer");
          showToast("Copied page link — opened assistant");
        } catch {
          showToast("Couldn’t copy or open");
        }
        setOpen(false);
      } finally {
        setBusy(false);
      }
    },
    [markdownUrl, pageUrl, showToast]
  );

  const viewAsMarkdown = useCallback(() => {
    window.open(markdownUrl, "_blank", "noopener,noreferrer");
    setOpen(false);
  }, [markdownUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <div className="doc-md-actions" ref={wrapRef}>
      <div className="doc-md-actions__split" role="group" aria-label="Page markdown actions">
        <button
          type="button"
          className="doc-md-actions__primary"
          onClick={() => void copyMarkdown()}
          disabled={busy}
          aria-busy={busy ? "true" : "false"}
        >
          <span className="doc-md-actions__primary-icon">
            <IconCopy />
          </span>
          <span>Copy Markdown</span>
        </button>
        <button
          type="button"
          className="doc-md-actions__chevron"
          aria-expanded={open ? "true" : "false"}
          aria-haspopup="menu"
          aria-label="More markdown and AI options"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          disabled={busy}
        >
          <IconChevron />
        </button>
      </div>

      {open && (
        <div className="doc-md-actions__menu" role="menu" aria-label="Markdown and AI">
          <div className="doc-md-actions__section">
            <button
              type="button"
              role="menuitem"
              className="doc-md-actions__row doc-md-actions__row--ai"
              onClick={() => void openInAssistant("claude")}
            >
              <span className="doc-md-actions__row-icon">
                <IconClaude />
              </span>
              <span className="doc-md-actions__row-text">
                <span className="doc-md-actions__muted">Open in</span>{" "}
                <strong>Claude</strong>
              </span>
              <IconExternal />
            </button>
            <button
              type="button"
              role="menuitem"
              className="doc-md-actions__row doc-md-actions__row--ai"
              onClick={() => void openInAssistant("chatgpt")}
            >
              <span className="doc-md-actions__row-icon">
                <IconChatGPT />
              </span>
              <span className="doc-md-actions__row-text">
                <span className="doc-md-actions__muted">Open in</span>{" "}
                <strong>ChatGPT</strong>
              </span>
              <IconExternal />
            </button>
            <button
              type="button"
              role="menuitem"
              className="doc-md-actions__row doc-md-actions__row--ai"
              onClick={() => void openInAssistant("cursor")}
            >
              <span className="doc-md-actions__row-icon">
                <IconCursor />
              </span>
              <span className="doc-md-actions__row-text">
                <span className="doc-md-actions__muted">Open in</span>{" "}
                <strong>Cursor</strong>
              </span>
              <IconExternal />
            </button>
          </div>
          <div className="doc-md-actions__divider" role="separator" />
          <div className="doc-md-actions__section">
            <button
              type="button"
              role="menuitem"
              className="doc-md-actions__row"
              onClick={() => void copyMarkdown()}
            >
              <span className="doc-md-actions__row-icon doc-md-actions__row-icon--sm">
                <IconCopy />
              </span>
              <span className="doc-md-actions__row-text doc-md-actions__row-text--full">
                Copy Markdown
              </span>
            </button>
            <button type="button" role="menuitem" className="doc-md-actions__row" onClick={viewAsMarkdown}>
              <span className="doc-md-actions__row-icon doc-md-actions__row-icon--sm">
                <IconMd />
              </span>
              <span className="doc-md-actions__row-text doc-md-actions__row-text--full">
                View as Markdown
              </span>
              <IconExternal />
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="doc-md-actions__toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}
