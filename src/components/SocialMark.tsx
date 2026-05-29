import type { ReactElement } from "react";

type SocialMarkProps = {
  provider: string;
};

export default function SocialMark({
  provider,
}: SocialMarkProps): ReactElement {
  if (provider === "microsoft") {
    return (
      <span className="social-mark microsoft" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  }

  return (
    <span className="social-mark google" aria-hidden="true">
      {provider.charAt(0).toUpperCase() || "?"}
    </span>
  );
}
