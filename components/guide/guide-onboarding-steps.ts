import type { ReactNode } from "react";

export interface OnboardingStep {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  time: string;
  tip?: string;
}

export const STORAGE_KEY = "pastr-onboarding-completed";
