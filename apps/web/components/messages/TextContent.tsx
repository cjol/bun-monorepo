"use client";

import { Paper } from "@mantine/core";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

interface TextContentProps {
  text: string;
}

// Custom components with inline styles for react-markdown
const components: Components = {
  p: ({ children }) => (
    <p style={{ margin: "0.5em 0", lineHeight: "1.6" }}>{children}</p>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight: 600, color: "#212529" }}>{children}</strong>
  ),
  em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
  ul: ({ children }) => (
    <ul style={{ margin: "0.75em 0", paddingLeft: "1.5em" }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: "0.75em 0", paddingLeft: "1.5em" }}>{children}</ol>
  ),
  li: ({ children }) => <li style={{ marginBottom: "0.25em" }}>{children}</li>,
  code: ({ children, className }) => {
    // Check if this is a code block (will have a language class)
    const isCodeBlock = className?.startsWith("language-");

    if (isCodeBlock) {
      return (
        <code
          className={className}
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
        >
          {children}
        </code>
      );
    }

    // Inline code
    return (
      <code
        style={{
          backgroundColor: "#f1f3f5",
          padding: "0.15em 0.4em",
          borderRadius: "4px",
          fontSize: "0.9em",
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          color: "#c92a2a",
        }}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre
      style={{
        backgroundColor: "#f8f9fa",
        padding: "12px",
        borderRadius: "8px",
        overflow: "auto",
        margin: "0.75em 0",
      }}
    >
      {children}
    </pre>
  ),
  h1: ({ children }) => (
    <h1
      style={{
        fontSize: "1.5em",
        fontWeight: 600,
        margin: "1em 0 0.5em",
        lineHeight: 1.3,
      }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      style={{
        fontSize: "1.3em",
        fontWeight: 600,
        margin: "1em 0 0.5em",
        lineHeight: 1.3,
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      style={{
        fontSize: "1.15em",
        fontWeight: 600,
        margin: "1em 0 0.5em",
        lineHeight: 1.3,
      }}
    >
      {children}
    </h3>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      style={{
        color: "#228be6",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.textDecoration = "underline";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.textDecoration = "none";
      }}
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote
      style={{
        borderLeft: "3px solid #ced4da",
        paddingLeft: "12px",
        margin: "0.75em 0",
        color: "#495057",
      }}
    >
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr
      style={{
        border: "none",
        borderTop: "1px solid #dee2e6",
        margin: "1.5em 0",
      }}
    />
  ),
};

export function TextContent({ text }: TextContentProps) {
  return (

                            <Paper p="md" bg="gray.1">
      <ReactMarkdown components={components}>{text}</ReactMarkdown>
</Paper>
  );
}
