import { useState } from "react";
import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
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
