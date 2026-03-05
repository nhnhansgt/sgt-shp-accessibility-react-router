import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "~/db.server";
import { AccessibilityRepository } from "~/repositories/accessibility.repository";
import { SaleBanner } from "~/components/sale-banner";
import { AccessibilityStatus } from "~/constants/accessibility.defaults";

// Guide steps data
interface GuideStep {
  number: number;
  title: string;
  description: string;
  href?: string;
  target?: string;
  links?: { label: string; href: string; target?: string }[];
}

const GETTING_STARTED_STEPS: GuideStep[] = [
  {
    number: 1,
    title: "Customize your widget",
    description: "Choose icons, colors, and position",
    href: "/app/widgets",
  },
  {
    number: 2,
    title: "Create your statement",
    description: "Write your accessibility statement",
    href: "/app/statement",
  },
  {
    number: 3,
    title: "Visit Help Center",
    description: "Get answers to common questions",
    href: "https://sgt-lab.com/help",
    target: "_blank",
  },
  {
    number: 4,
    title: "Website & Facebook",
    description: "Learn more about our services",
    links: [
      { label: "Website", href: "https://sgt-lab.com" },
      { label: "Facebook", href: "https://facebook.com/sgtlab" },
    ],
  },
  {
    number: 5,
    title: "Manage your plan",
    description: "View or change your subscription",
    href: "/app/plans",
  },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const repository = new AccessibilityRepository(prisma);
  const settings = await repository.findOrCreate(shopDomain);

  return {
    isAccessibilityOn: settings.status === AccessibilityStatus.ENABLED,
    isYearEndSale: false,
    saleDays: 0,
  };
};

export default function Setup() {
  const { isAccessibilityOn, isYearEndSale, saleDays } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Quick Start">
      {isYearEndSale && <SaleBanner saleDays={saleDays} />}

      <s-section>
        <s-box
          padding="base"
          background={isAccessibilityOn ? "subdued" : "subdued"}
          borderRadius="base"
        >
          <s-stack direction="inline" gap="base">
            <s-text>
              {isAccessibilityOn
                ? "Accessibility is enabled"
                : "Accessibility is not enabled"}
            </s-text>
            <s-button variant="secondary">
              Open Theme Editor
            </s-button>
          </s-stack>
        </s-box>
      </s-section>

      <s-section>
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="subdued"
        >
          <s-stack direction="block" gap="base">
            <s-heading>Welcome to Accessibility App</s-heading>

            <s-paragraph>
              Getting started is easy! Follow these steps to make your store more accessible:
            </s-paragraph>

            <s-unordered-list>
              {GETTING_STARTED_STEPS.map((step) => (
                <s-list-item key={step.number}>
                  <s-stack direction="block" gap="base">
                    <s-text>
                      <strong>{step.number}. {step.title}</strong>
                      {" - "}{step.description}
                    </s-text>
                    {step.links ? (
                      <s-stack direction="inline" gap="base">
                        {step.links.map((link) => (
                          <s-link
                            key={link.label}
                            href={link.href}
                            target={link.target || "_blank"}
                          >
                            {link.label}
                          </s-link>
                        ))}
                      </s-stack>
                    ) : step.href ? (
                      <s-link href={step.href} target={step.target}>
                        Go to {step.title.toLowerCase()}
                      </s-link>
                    ) : null}
                  </s-stack>
                </s-list-item>
              ))}
            </s-unordered-list>
          </s-stack>
        </s-box>
      </s-section>

      <s-section>
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="subdued"
        >
          <s-stack direction="block" gap="base">
            <s-heading>Have questions or need assistance?</s-heading>

            <s-paragraph>
              Our team is here to help you with any questions about accessibility.
            </s-paragraph>

            <s-stack direction="inline" gap="base">
              <s-button
                variant="primary"
                aria-label="Open chat support"
                onClick={() => {
                  window.open("https://crisp.chat", "_blank");
                }}
              >
                Chat with us
              </s-button>

              <s-button
                variant="secondary"
                aria-label="Send email to support"
                onClick={() => {
                  window.location.href = "mailto:support@sgt-lab.com";
                }}
              >
                Email
              </s-button>

              <s-button
                variant="secondary"
                aria-label="Open knowledge base"
                onClick={() => {
                  window.open("https://sgt-lab.com/help", "_blank");
                }}
              >
                Knowledge Base
              </s-button>
            </s-stack>

            <s-box padding="base">
              <s-text color="subdued">
                <div style={{ textAlign: "center" }}>Technical Support Available</div>
              </s-text>
            </s-box>
          </s-stack>
        </s-box>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(new Error("Setup page error"));
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};