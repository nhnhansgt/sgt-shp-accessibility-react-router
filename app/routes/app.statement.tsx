import { useState, useRef, useEffect } from "react";
import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

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

// Editor styles
const EDITOR_CONTAINER_STYLE = {
  borderWidth: "1px",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  overflow: "hidden",
  borderStyle: "solid",
  borderColor: "#c9cccf",
};

const EDITOR_STYLE = {
  padding: "16px",
  minHeight: "400px",
  maxHeight: "600px",
  overflowY: "auto" as const,
  fontSize: "16px",
  lineHeight: 1.6,
};

// Editor content styles (injected via style tag)
const EDITOR_STYLES = `
  .statement-editor h1 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 16px;
    color: #202223;
  }

  .statement-editor h2 {
    font-size: 22px;
    font-weight: 600;
    margin-top: 24px;
    margin-bottom: 12px;
    color: #202223;
  }

  .statement-editor h3 {
    font-size: 18px;
    font-weight: 600;
    margin-top: 20px;
    margin-bottom: 8px;
    color: #202223;
  }

  .statement-editor p {
    margin-bottom: 16px;
    line-height: 1.6;
    color: #202223;
  }

  .statement-editor ul,
  .statement-editor ol {
    margin-bottom: 16px;
    padding-left: 24px;
  }

  .statement-editor li {
    margin-bottom: 8px;
  }

  .statement-editor a {
    color: #007ace;
    text-decoration: underline;
  }

  .statement-editor img {
    max-width: 100%;
    height: auto;
    margin: 16px 0;
  }

  .statement-editor blockquote {
    border-left: 4px solid #c9cccf;
    padding-left: 16px;
    margin: 16px 0;
    color: #6d7175;
    font-style: italic;
  }

  .statement-editor strong {
    font-weight: 600;
  }

  .statement-editor em {
    font-style: italic;
  }

  .statement-editor u {
    text-decoration: underline;
  }
`;

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

  // Inject editor styles
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = EDITOR_STYLES;
    styleSheet.id = "statement-editor-styles";
    document.head.appendChild(styleSheet);

    return () => {
      const existing = document.getElementById("statement-editor-styles");
      if (existing) {
        document.head.removeChild(existing);
      }
    };
  }, []);

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  // Execute rich text commands
  const handleExecCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    setIsDirty(true);
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);

    // TODO: Replace with actual API call to save statement
    console.log("Saving statement:", editorContent);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSaving(false);
    setIsDirty(false);

    // TODO: Show success toast
    alert("Statement saved! (Mock - no backend)");
  };

  // Handle reset to default
  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset to the default statement? All changes will be lost.")) {
      setEditorContent(MOCK_STATEMENT_CONTENT);
      setIsDirty(false);
    }
  };

  return (
    <s-page heading="Accessibility Statement">
      {/* Editor Section */}
      <s-section>
        <div style={EDITOR_CONTAINER_STYLE}>
          <EditorToolbar onCommand={handleExecCommand} />
          <ContentEditor
            content={editorContent}
            onChange={(newContent) => {
              setEditorContent(newContent);
              setIsDirty(true);
            }}
          />
        </div>
      </s-section>

      {/* Action Buttons Section */}
      <s-section>
        <s-stack direction="inline" gap="base">
          <s-button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            aria-label="Save statement"
          >
            {isSaving ? "Saving..." : "Save"}
          </s-button>

          <s-button
            variant="secondary"
            onClick={handleReset}
            disabled={isSaving}
            aria-label="Reset to default statement"
          >
            Reset to Default
          </s-button>
        </s-stack>
      </s-section>

      {/* Footer Links Section */}
      <s-section>
        <s-stack direction="inline" gap="base">
          <s-link href={links.privacyPolicy} target="_blank">
            Privacy Policy
          </s-link>
          <s-link href={links.termsOfService} target="_blank">
            Terms of Service
          </s-link>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(new Error("Statement page error"));
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

// ContentEditable Editor component
function ContentEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (content: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div
      ref={editorRef}
      contentEditable
      onInput={handleInput}
      style={EDITOR_STYLE}
      role="textbox"
      aria-label="Accessibility statement editor"
      aria-multiline="true"
      suppressContentEditableWarning
      className="statement-editor"
    />
  );
}

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

// TODO: Replace mock content with actual query from database
// TODO: Implement actual save functionality with API call
// TODO: Add success/error toast notifications using Shopify toast API
// TODO: Add Japanese language support (i18n)
// TODO: Implement auto-save functionality with debounce
// TODO: Add character/word count display
// TODO: Add statement preview in new window/tab
// TODO: Implement version history/undo functionality
// TODO: Add HTML sanitization before saving
// TODO: Add validation for statement content (min length, required sections)
// TODO: Add Draft.js or TipTap integration for better rich text editing
// TODO: Add keyboard shortcuts (Ctrl+S for save, Ctrl+Z for undo)
// TODO: Add focus management and screen reader announcements
// TODO: Add image upload functionality (not just URL)
// TODO: Add link editing (modify existing links)
