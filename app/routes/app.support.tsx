import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

// Mock data - TODO: Replace with actual data from database
const MOCK_DATA = {
  isYearEndSale: true,
  saleDays: 90,
  videoUrl: "https://www.youtube.com/embed/e0WOkdanoJo",
  videoTitle: "How to use Accessibility app",
  supportEmail: "support@sgt-lab.com",
  knowledgeBaseUrl: "https://sgt-lab.com/help/category/accessibility-faqs/",
  links: {
    privacyPolicy: "https://sgt-lab.com/privacy",
    termsOfService: "https://sgt-lab.com/terms",
  },
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // TODO: Replace with actual query to get store settings
  return {
    ...MOCK_DATA,
  };
};

export default function Support() {
  const {
    isYearEndSale,
    saleDays,
    videoUrl,
    videoTitle,
    supportEmail,
    knowledgeBaseUrl,
    links,
  } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Guides & Support">
      {/* Year End Sale Banner - Conditional */}
      {isYearEndSale && (
        <s-section>
          <s-box
            padding="base"
            background="subdued"
            borderRadius="base"
          >
            <s-stack direction="inline" gap="base">
              <span>🎉</span>
              <s-text>
                Year End Sale! Get <strong>{saleDays} days</strong> free trial instead of 14!
              </s-text>
            </s-stack>
          </s-box>
        </s-section>
      )}

      {/* Video Tutorial Section */}
      <s-section>
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="subdued"
        >
          <s-heading>How to use Accessibility app</s-heading>
          <div
            style={{
              position: "relative",
              paddingBottom: "56.25%",
              height: 0,
              overflow: "hidden",
              marginTop: "16px",
              borderRadius: "8px",
            }}
          >
            <iframe
              src={videoUrl}
              title={videoTitle}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </s-box>
      </s-section>

      {/* Support Options Section */}
      <s-section>
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="subdued"
        >
          <s-heading>Have questions or need assistance?</s-heading>

          <s-paragraph>
            We respond within <strong>12 - 24 hours</strong> via email
          </s-paragraph>

          <div style={{ marginTop: "16px" }}>
            <s-stack direction="inline" gap="base">
              {/* Chat with us button */}
              <s-button
                variant="primary"
                onClick={() => {
                  // TODO: Open Crisp chat widget
                  // TODO: Integrate with Crisp chat using script ID: d170d7db-9b6f-4278-9058-c0216e1daeb7
                  console.log("Open Crisp chat");
                }}
                aria-label="Chat with support"
              >
                Chat with us
              </s-button>

              {/* Email button */}
              <s-button
                variant="secondary"
                onClick={() => {
                  window.location.href = `mailto:${supportEmail}`;
                }}
                aria-label={`Email support at ${supportEmail}`}
              >
                Email
              </s-button>

              {/* Knowledge Base button */}
              <s-button
                variant="secondary"
                onClick={() => {
                  window.open(knowledgeBaseUrl, "_blank");
                }}
                aria-label="Visit Knowledge Base"
              >
                Knowledge Base
              </s-button>
            </s-stack>
          </div>

          {/* Technical Support Illustration */}
          <div
            style={{
              textAlign: "center",
              marginTop: "24px",
            }}
          >
            <div
              style={{
                fontSize: "64px",
                marginBottom: "8px",
              }}
            >
              🛠️
            </div>
            <s-text color="subdued">Technical Support Team</s-text>
          </div>
        </s-box>
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
  return boundary.error(new Error("Support page error"));
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

// TODO: Replace mock data with actual query from database
// TODO: Implement Crisp chat widget integration (CHAT_SCRIPT_ID: d170d7db-9b6f-4278-9058-c0216e1daeb7)
// TODO: Add Japanese language support using multipleLanguageSelector hook
// TODO: Add responsive design for mobile/tablet
// TODO: Add loading state for video embed
// TODO: Add video thumbnail/preview before loading
// TODO: Add FAQ accordion section
// TODO: Add search functionality for knowledge base
