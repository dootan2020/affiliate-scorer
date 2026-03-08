import { GuideCallout } from "./guide-callout";
import { GuideSectionQuickStart } from "./guide-section-quick-start";
import { GuideSectionWorkflow } from "./guide-section-workflow";
import { GuideSectionFlows } from "./guide-section-flows";
import { GuideSectionFeatures } from "./guide-section-features";
import { GuideSectionAdvisorTelegram } from "./guide-section-advisor-telegram";
import { GuideSectionAiConfig } from "./guide-section-ai-config";
import { GuideSectionFaq } from "./guide-section-faq";
import { GuideSectionTips } from "./guide-section-tips";

export function GuideContent(): React.ReactElement {
  return (
    <>
      <GuideSectionQuickStart />
      <GuideSectionWorkflow />
      <GuideSectionFlows />
      <GuideSectionFeatures />
      <GuideSectionAdvisorTelegram />
      <GuideSectionAiConfig />
      <GuideSectionFaq />
      <GuideSectionTips />
    </>
  );
}

export { GuideCallout };
