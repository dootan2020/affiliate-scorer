import { GuideCallout } from "./guide-callout";
import { GuideSectionQuickStart } from "./guide-section-quick-start";
import { GuideSectionWorkflow } from "./guide-section-workflow";
import { GuideSectionFeatures } from "./guide-section-features";
import { GuideSectionAiConfig } from "./guide-section-ai-config";
import { GuideSectionFaqTips } from "./guide-section-faq-tips";

export function GuideContent(): React.ReactElement {
  return (
    <>
      <GuideSectionQuickStart />
      <GuideSectionWorkflow />
      <GuideSectionFeatures />
      <GuideSectionAiConfig />
      <GuideSectionFaqTips />
    </>
  );
}

export { GuideCallout };
