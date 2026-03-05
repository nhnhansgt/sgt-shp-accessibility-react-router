interface SaleBannerProps {
  saleDays: number;
}

export function SaleBanner({ saleDays }: SaleBannerProps) {
  return (
    <s-section>
      <s-box padding="base" background="subdued" borderRadius="base">
        <s-stack direction="inline" gap="base">
          <span>🎉</span>
          <s-text>
            Year End Sale! Get <strong>{saleDays} days</strong> free trial instead of 14!
          </s-text>
        </s-stack>
      </s-box>
    </s-section>
  );
}
