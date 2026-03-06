import { useEffect, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useSearchParams, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function ExitIframe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirectUri = searchParams.get("redirectUri");

    if (!redirectUri) {
      setError("Missing redirectUri parameter");
      return;
    }

    try {
      const url = new URL(redirectUri);

      // Validate hostname matches current domain (security check)
      if (url.hostname !== window.location.hostname) {
        setError("Invalid redirect domain");
        return;
      }

      // Use App Bridge redirect or navigate directly
      navigate(url.pathname + url.search + url.hash, { replace: true });
    } catch (err) {
      setError("Invalid redirect URL");
    }
  }, [searchParams, navigate]);

  return (
    <s-page heading="Redirecting...">
      {error ? (
        <s-section>
          <s-box
            padding="base"
            background="subdued"
            borderRadius="base"
            borderWidth="base"
          >
            <s-stack direction="block" gap="base">
              <s-text>{error}</s-text>
              <s-button
                variant="primary"
                onClick={() => navigate("/app/setup")}
              >
                Go to Setup
              </s-button>
            </s-stack>
          </s-box>
        </s-section>
      ) : (
        <s-section>
          <s-stack direction="block" gap="base">
            <s-box
              padding="base"
              background="subdued"
              borderRadius="base"
              borderWidth="base"
            >
              <s-stack direction="block" gap="base">
                <s-spinner />
                <s-paragraph>Redirecting...</s-paragraph>
              </s-stack>
            </s-box>
          </s-stack>
        </s-section>
      )}
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(new Error("ExitIframe page error"));
}
