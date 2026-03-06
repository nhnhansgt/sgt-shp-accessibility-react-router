declare module "*.css";

// Polaris Web Components type declarations
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "s-page": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        heading?: string;
        slot?: string;
      };
      "s-section": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        heading?: string;
        slot?: string;
      };
      "s-box": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        padding?: "base" | "loose" | "tight";
        background?: "subdued" | "bg" | "primary" | "secondary";
        borderRadius?: "base" | "full";
        borderWidth?: "base";
        maxWidth?: string;
        width?: string;
        height?: string;
      };
      "s-stack": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        direction?: "block" | "inline";
        gap?: "tight" | "base" | "loose";
        alignment?: "center" | "start" | "end";
      };
      "s-text": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        color?: "subdued" | "critical";
        variant?: string;
      };
      "s-heading": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        level?: number;
      };
      "s-button": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: "primary" | "secondary" | "tertiary";
        onClick?: () => void;
        loading?: boolean;
        disabled?: boolean;
        slot?: string;
        target?: string;
      };
      "s-link": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        href?: string;
        target?: string;
      };
      "s-divider": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "s-unordered-list": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "s-list-item": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "s-app-nav": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "s-spinner": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        size?: "small" | "base" | "large";
      };
      "s-badge": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "s-paragraph": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export {};
