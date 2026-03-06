import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { useState, useEffect } from "react";
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

// Welcome modal slides
interface WelcomeSlide {
  title: string;
  description: string;
  icon: string;
}

const SLIDES: WelcomeSlide[] = [
  {
    title: "Welcome",
    description: "Make your store accessible to everyone",
    icon: "♿",
  },
  {
    title: "Customize",
    description: "Personalize your widget to match your brand",
    icon: "🎨",
  },
  {
    title: "Statement",
    description: "Create a WCAG compliant accessibility statement",
    icon: "📄",
  },
  {
    title: "Support",
    description: "We're here to help 24/7",
    icon: "💬",
  },
  {
    title: "Ready",
    description: "Start your 14-day free trial today!",
    icon: "🚀",
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
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Check if first visit
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      setShowWelcomeModal(true);
      localStorage.setItem("hasSeenOnboarding", "true");
    }
  }, []);

  // Auto-slide functionality
  useEffect(() => {
    if (!showWelcomeModal) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000); // 5 seconds per slide

    return () => clearInterval(interval);
  }, [showWelcomeModal]);

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
            <s-button
              variant="secondary"
              onClick={() => {
                // Open Shopify Theme Editor in new tab
                window.open("/admin/themes/current/editor", "_blank");
              }}
            >
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

      {/* Welcome Modal for First-Time Users */}
      {showWelcomeModal && (
        <s-section>
          <div
            role="button"
            tabIndex={0}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setShowWelcomeModal(false)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                setShowWelcomeModal(false);
              }
            }}
            aria-label="Close welcome modal"
          >
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <div
              style={{
                maxWidth: "400px",
                width: "100%",
              }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="welcome-modal-title"
              tabIndex={-1}
            >
              <s-box
                padding="base"
                background="subdued"
                borderRadius="base"
              >
                <s-stack direction="block" gap="base">
                  <s-heading id="welcome-modal-title">{SLIDES[currentSlide].title}</s-heading>
                  <s-paragraph>{SLIDES[currentSlide].description}</s-paragraph>
                  <div style={{ fontSize: "64px" }}>{SLIDES[currentSlide].icon}</div>

                  {/* Dots indicator */}
                  <s-stack direction="inline" gap="base">
                    {SLIDES.map((_, index) => (
                      <div
                        key={index}
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "4px",
                          backgroundColor: index === currentSlide ? "#008060" : "#dcdcdc",
                        }}
                      />
                    ))}
                  </s-stack>

                  <s-button
                    variant="primary"
                    onClick={() => {
                      if (currentSlide === SLIDES.length - 1) {
                        setShowWelcomeModal(false);
                      } else {
                        setCurrentSlide((prev) => prev + 1);
                      }
                    }}
                  >
                    {currentSlide === SLIDES.length - 1 ? "Get Started" : "Next"}
                  </s-button>
                </s-stack>
              </s-box>
            </div>
          </div>
        </s-section>
      )}
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(new Error("Setup page error"));
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};