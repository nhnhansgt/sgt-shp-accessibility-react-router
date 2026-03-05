import { useState } from "react";
import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";

// Toolbar button configuration
interface ToolbarButton {
  id: string;
  label: string;
  icon: string;
  command: string;
  arg?: string;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { id: "bold", label: "Bold (Ctrl+B)", icon: "B", command: "bold" },
  { id: "italic", label: "Italic (Ctrl+I)", icon: "I", command: "italic" },
  { id: "underline", label: "Underline (Ctrl+U)", icon: "U", command: "underline" },
  { id: "separator-1", label: "", icon: "|", command: "separator" },
  { id: "unordered-list", label: "Bullet List", icon: "•", command: "insertUnorderedList" },
  { id: "ordered-list", label: "Numbered List", icon: "1.", command: "insertOrderedList" },
  { id: "separator-2", label: "", icon: "|", command: "separator" },
  { id: "align-left", label: "Align Left", icon: "≡", command: "justifyLeft" },
  { id: "align-center", label: "Align Center", icon: "☰", command: "justifyCenter" },
  { id: "align-right", label: "Align Right", icon: "≣", command: "justifyRight" },
  { id: "separator-3", label: "", icon: "|", command: "separator" },
  { id: "link", label: "Insert Link", icon: "🔗", command: "link" },
  { id: "image", label: "Insert Image", icon: "🖼", command: "image" },
];
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

// Mock data - TODO: Replace with actual data from database
const MOCK_STATEMENT_CONTENT = `
  <h1>Accessibility Statement</h1>
  <p>We are committed to ensuring digital accessibility for people with disabilities. We believe the internet should be accessible to everyone, regardless of their abilities.</p>

  <h2>Our Commitment</h2>
  <p>We strive to make our website accessible to the widest possible audience, including people with visual, auditory, motor, and cognitive disabilities.</p>

  <h2>Features</h2>
  <ul>
    <li>Font size adjustment</li>
    <li>Screen reader compatibility</li>
    <li>High contrast mode</li>
    <li>Link highlighting</li>
    <li>Keyboard navigation support</li>
  </ul>

  <h2>Conformance Status</h2>
  <p>Our website conforms to WCAG 2.1 Level AA guidelines.</p>
`;

// Default links
const DEFAULT_LINKS = {
  privacyPolicy: "https://sgt-lab.com/privacy",
  termsOfService: "https://sgt-lab.com/terms",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // TODO: Replace with actual query to get statement from database
  return {
    content: MOCK_STATEMENT_CONTENT,
    links: DEFAULT_LINKS,
  };
};

export default function Statement() {
  const { content, links } = useLoaderData<typeof loader>();

  // State management for editor
  const [editorContent, setEditorContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Execute rich text commands
  const handleExecCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    setIsDirty(true);
  };

  return (
    <s-page heading="Accessibility Statement">
      {/* TODO: Add editor UI */}
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(new Error("Statement page error"));
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

// TODO: Replace mock content with actual query from database
// TODO: Implement actual save functionality with API call
// TODO: Add success/error toast notifications
// TODO: Add Japanese language support
// TODO: Implement rich text editor with Draft.js or similar
// TODO: Add validation for statement content
// TODO: Implement reset to default functionality

// Toolbar component
function EditorToolbar({ onCommand }: { onCommand: (command: string, arg?: string) => void }) {
  const handleToolbarClick = (button: ToolbarButton) => {
    if (button.command === "separator") return;

    if (button.command === "link") {
      const url = prompt("Enter link URL:");
      if (url) {
        onCommand(button.command, url);
      }
      return;
    }

    if (button.command === "image") {
      const url = prompt("Enter image URL:");
      if (url) {
        onCommand(button.command, url);
      }
      return;
    }

    onCommand(button.command);
  };

  return (
    <div
      style={{
        padding: "16px",
        borderWidth: "1px",
        borderBottomWidth: "0",
        borderTopLeftRadius: "8px",
        borderTopRightRadius: "8px",
        backgroundColor: "#f6f6f7",
        borderStyle: "solid",
        borderColor: "#c9cccf",
      }}
    >
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
        {TOOLBAR_BUTTONS.map((button) => (
          button.command === "separator" ? (
            <div
              key={button.id}
              style={{
                width: "1px",
                height: "24px",
                backgroundColor: "#c9cccf",
                margin: "0 8px",
                alignSelf: "center",
              }}
            />
          ) : (
            <button
              key={button.id}
              onClick={() => handleToolbarClick(button)}
              title={button.label}
              aria-label={button.label}
              style={{
                padding: "8px 12px",
                border: "1px solid #c9cccf",
                borderRadius: "4px",
                backgroundColor: "#ffffff",
                cursor: "pointer",
                fontSize: "16px",
                minWidth: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {button.icon}
            </button>
          )
        ))}
      </div>
    </div>
  );
}
