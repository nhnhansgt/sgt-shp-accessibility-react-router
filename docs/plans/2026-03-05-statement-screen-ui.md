# Statement Screen UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Statement Screen (`/app/statement`) UI with a rich text editor for creating and editing the accessibility statement, using mock data for display.

**Architecture:** Single React Router route file using Polaris web components with a toolbar-based rich text editor. The route will follow the same patterns as existing routes (`app.setup.tsx`, `app.widgets.tsx`).

**Tech Stack:** React Router, Polaris web components, TypeScript, contentEditable-based rich text editor, mock data.

**Note:** This task is ONLY responsible for building the interface. Do not perform logic that is not related to the interface. Use fake data for display where necessary.

---

## Task 1: Create Statement Screen Route File

**Files:**
- Create: `app/routes/app.statement.tsx`

**Steps:**
1. Create route file with loader function (auth check required)
2. Add default export component with basic Statement page UI
3. Add mock data for statement content
4. Add ErrorBoundary and headers functions
5. Verify with `npm run typecheck`
6. Commit: `git add app/routes/app.statement.tsx && git commit -m "feat: add Statement screen route with basic structure"`

---

## Task 2: Add Rich Text Editor Toolbar Component

**Files:**
- Modify: `app/routes/app.statement.tsx`

**Steps:**
1. Add ToolbarButton interface and TOOLBAR_BUTTONS constant with:
   - Bold (B), Italic (I), Underline (U)
   - Separators
   - Unordered List (•), Ordered List (1.)
   - Align Left (≡), Align Center (☰), Align Right (≣)
   - Link (🔗), Image (🖼)
2. Add state: editorContent, isSaving, isDirty
3. Create EditorToolbar component with click handlers
4. Verify with `npm run typecheck`
5. Commit: `git commit -m "feat: add rich text editor toolbar"`

---

## Task 3: Add ContentEditable Editor Component

**Files:**
- Modify: `app/routes/app.statement.tsx`

**Steps:**
1. Add EDITOR_CONTAINER_STYLE and EDITOR_STYLE constants
2. Add handleExecCommand function using document.execCommand
3. Create ContentEditor component with useRef and contentEditable
4. Add useRef, useEffect to imports
5. Verify with `npm run typecheck`
6. Commit: `git commit -m "feat: add contenteditable editor component"`

---

## Task 4: Add Main Editor UI Section

**Files:**
- Modify: `app/routes/app.statement.tsx`

**Steps:**
1. Add main return JSX with:
   - Editor Container with Toolbar + ContentEditor
   - Action Buttons (Save, Reset)
   - Footer Links (Privacy Policy, Terms)
2. Add handleSave and handleReset functions
3. Verify with `npm run typecheck`
4. Commit: `git commit -m "feat: add main editor UI and save/reset handlers"`

---

## Task 5: Add Editor Styling and Polish

**Files:**
- Modify: `app/routes/app.statement.tsx`

**Steps:**
1. Add EDITOR_STYLES constant with CSS for h1, h2, p, ul, ol, li, a, etc.
2. Add useEffect to inject styles into document.head
3. Update ContentEditor to use "statement-editor" class
4. Verify with `npm run typecheck`
5. Commit: `git commit -m "feat: add editor styling and polish"`

---

## Task 6: Add Unsaved Changes Warning

**Files:**
- Modify: `app/routes/app.statement.tsx`

**Steps:**
1. Add useEffect with beforeunload event listener
2. Warn user when isDirty is true and trying to close page
3. Verify with `npm run typecheck`
4. Commit: `git commit -m "feat: add unsaved changes warning"`

---

## Task 7: Manual Testing and TODO Documentation

**Files:**
- Modify: `app/routes/app.statement.tsx`

**Testing Steps:**
Run `npm run dev` and navigate to `http://localhost:3000/app/statement`

Verify all features work:
- Heading, Toolbar, all formatting buttons
- Editor is editable, content updates
- Save button state (disabled/enabled/loading)
- Reset button confirmation
- Footer links display
- Browser warning on unsaved changes

**Final TODO comments to add:**
- Replace mock content with database query
- Implement actual save API call
- Add success/error toast notifications
- Add Japanese language support
- Implement auto-save with debounce
- Add HTML sanitization
- Add Draft.js or TipTap integration

Commit: `git commit -m "feat: add TODO documentation"`

---

## Testing Checklist

- [ ] "Accessibility Statement" heading displays
- [ ] Toolbar displays with all formatting buttons
- [ ] Bold, Italic, Underline buttons work
- [ ] Bullet list and Numbered list work
- [ ] Alignment buttons (left/center/right) work
- [ ] Link button prompts for URL and inserts link
- [ ] Image button prompts for URL and inserts image
- [ ] Editor content area is visible and editable
- [ ] Content updates as user types
- [ ] Save button disabled when no changes
- [ ] Save button shows loading state
- [ ] Reset button prompts for confirmation
- [ ] Privacy Policy and Terms links display
- [ ] Browser warning on unsaved changes
- [ ] TypeScript compiles without errors
- [ ] Editor styles apply correctly

---

## Notes

- Uses contentEditable for rich text editing
- document.execCommand for formatting (deprecated but widely supported)
- Mock data only - no backend integration
- Editor styles injected via JavaScript
- No HTML sanitization implemented yet
- Production should use Draft.js, TipTap, or Quill
