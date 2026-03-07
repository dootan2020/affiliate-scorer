"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { PipelineStepper } from "@/components/shared/pipeline-stepper";
import {
  StepInterests,
  StepExperience,
  StepGoals,
  StepStyle,
} from "./questionnaire-steps";
import { NicheRecommendations } from "./niche-recommendations";
import type { QuestionnaireAnswers, NicheRecommendation } from "@/lib/niche-intelligence/types";

const STEPS = [
  { key: "interests", label: "Linh vuc" },
  { key: "experience", label: "Kinh nghiem" },
  { key: "goals", label: "Muc tieu" },
  { key: "style", label: "Phong cach" },
];

const DEFAULT_ANSWERS: QuestionnaireAnswers = {
  interests: [],
  experience: "beginner",
  goals: [],
  contentStyle: [],
  budget: "zero",
};

type Phase = "questionnaire" | "loading" | "results";

export function NicheFinderClient(): React.ReactElement {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("questionnaire");
  const [activeStep, setActiveStep] = useState("interests");
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(DEFAULT_ANSWERS);
  const [recommendations, setRecommendations] = useState<NicheRecommendation[]>([]);
  const [summary, setSummary] = useState("");
  const [profileId, setProfileId] = useState("");
  const [error, setError] = useState("");

  const stepIndex = STEPS.findIndex((s) => s.key === activeStep);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STEPS.length - 1;

  const canProceed = useCallback((): boolean => {
    switch (activeStep) {
      case "interests":
        return answers.interests.length > 0;
      case "experience":
        return true; // always has default
      case "goals":
        return answers.goals.length > 0;
      case "style":
        return answers.contentStyle.length > 0;
      default:
        return false;
    }
  }, [activeStep, answers]);

  const handleNext = useCallback(async (): Promise<void> => {
    if (!canProceed()) return;

    if (isLastStep) {
      // Submit to API
      setPhase("loading");
      setError("");

      try {
        const res = await fetch("/api/niche-intelligence/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(answers),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Loi khi phan tich");
        }

        const data = await res.json();
        setRecommendations(data.recommendations);
        setSummary(data.summary);
        setProfileId(data.profileId);
        setPhase("results");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Loi khong xac dinh");
        setPhase("questionnaire");
      }
    } else {
      setActiveStep(STEPS[stepIndex + 1].key);
    }
  }, [canProceed, isLastStep, answers, stepIndex]);

  const handleBack = useCallback((): void => {
    if (!isFirstStep) {
      setActiveStep(STEPS[stepIndex - 1].key);
    }
  }, [isFirstStep, stepIndex]);

  const handleSelectNiche = useCallback(
    async (nicheKey: string, nicheLabel: string): Promise<void> => {
      try {
        const res = await fetch("/api/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nicheLabel,
            niche: nicheKey,
            personaName: nicheLabel,
            personaDesc: `Kenh affiliate ${nicheLabel} tren TikTok`,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Loi khi tao kenh");
        }

        const channel = await res.json();

        // Update NicheProfile with selected niche and channel
        await fetch("/api/niche-intelligence/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileId,
            selectedNiche: nicheKey,
            channelId: channel.id,
          }),
        });

        router.push(`/channels/${channel.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Loi khi tao kenh");
      }
    },
    [profileId, router]
  );

  const handleRetry = useCallback((): void => {
    setPhase("questionnaire");
    setActiveStep("interests");
    setAnswers(DEFAULT_ANSWERS);
    setError("");
  }, []);

  // ─── Loading phase ───
  if (phase === "loading") {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">
          AI dang phan tich...
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Dang ket hop du lieu thi truong voi cau tra loi cua ban de tim ngach phu hop nhat
        </p>
      </div>
    );
  }

  // ─── Results phase ───
  if (phase === "results") {
    return (
      <NicheRecommendations
        recommendations={recommendations}
        summary={summary}
        onSelect={handleSelectNiche}
        onRetry={handleRetry}
      />
    );
  }

  // ─── Questionnaire phase ───
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 space-y-6">
      <PipelineStepper
        steps={STEPS}
        activeStep={activeStep}
        onStepChange={(key) => {
          const targetIdx = STEPS.findIndex((s) => s.key === key);
          if (targetIdx <= stepIndex) setActiveStep(key);
        }}
      />

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3">
          <span className="text-sm text-rose-700 dark:text-rose-300">{error}</span>
        </div>
      )}

      <div className="min-h-[280px]">
        {activeStep === "interests" && (
          <StepInterests answers={answers} onChange={setAnswers} />
        )}
        {activeStep === "experience" && (
          <StepExperience answers={answers} onChange={setAnswers} />
        )}
        {activeStep === "goals" && (
          <StepGoals answers={answers} onChange={setAnswers} />
        )}
        {activeStep === "style" && (
          <StepStyle answers={answers} onChange={setAnswers} />
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
        <button
          type="button"
          onClick={handleBack}
          disabled={isFirstStep}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lai
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed()}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLastStep ? (
            <>
              <Sparkles className="w-4 h-4" />
              Phan tich ngach
            </>
          ) : (
            <>
              Tiep theo
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
