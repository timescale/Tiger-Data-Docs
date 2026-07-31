/**
 * URL-encodes a password (or any string) for use in a `postgres://` connection
 * URI. Replaces this component with a plain note in non-JS environments.
 *
 * @see _livesync-connection-string-note.mdx
 */
import { useState, useCallback } from "react";
import CopyToClipboard from "./CopyToClipboard";

export interface PasswordEncoderProps {
  /** Placeholder for the input. Default: "Paste your password". */
  placeholder?: string;
}

export default function PasswordEncoder({
  placeholder = "Paste your password",
}: PasswordEncoderProps) {
  const [value, setValue] = useState("");

  const encoded = useCallback((s: string) => {
    return s === "" ? "" : encodeURIComponent(s);
  }, []);

  const result = encoded(value);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label
        htmlFor="password-encoder-input"
        style={{ fontWeight: 600, fontSize: "0.875rem" }}
      >
        Password
      </label>
      <input
        id="password-encoder-input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        aria-describedby="password-encoder-hint"
        style={{
          padding: "0.5rem 0.75rem",
          borderRadius: "0.375rem",
          border: "1px solid var(--sl-color-gray-5, #ccc)",
          background: "var(--sl-color-bg, #fff)",
          color: "var(--sl-color-text, #000)",
          fontSize: "0.875rem",
          fontFamily: "var(--sl-font-mono, monospace)",
        }}
      />
      <p
        id="password-encoder-hint"
        style={{ margin: 0, fontSize: "0.8125rem", color: "var(--sl-color-text-soft, #666)" }}
      >
        Enter your password to get the URL-encoded version. Characters that are
        safe in a URI (like <code>*</code>, <code>~</code>, <code>.</code>, <code>-</code>, <code>_</code>)
        are left as-is.
      </p>
      {result !== "" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "0.375rem",
            background: "var(--sl-color-gray-7, #f5f5f5)",
            border: "1px solid var(--sl-color-gray-5, #e0e0e0)",
          }}
        >
          <code
            style={{
              flex: 1,
              fontSize: "0.8125rem",
              wordBreak: "break-all",
              fontFamily: "var(--sl-font-mono, monospace)",
            }}
          >
            {result}
          </code>
          <CopyToClipboard text={result} label="Copy" copiedLabel="Copied!" variant="subtle" />
        </div>
      )}
    </div>
  );
}
