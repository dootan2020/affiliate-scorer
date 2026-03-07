"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, SearchX, RotateCcw } from "lucide-react";
import { PipelineStepper } from "@/components/shared/pipeline-stepper";
import {
  StepInterests,
  StepExperience,
  StepGoals,
  StepStyle,
} from "./questionnaire-steps";
import { NicheRecommendations } from "./niche-recommendations";
import { NicheConfirmDialog } from "./niche-confirm-dialog";
import type { QuestionnaireAnswers, NicheRecommendation } from "@/lib/niche-intelligence/types";

const STEPS = [
  { key: "interests", label: "Lĩnh vực" },
  { key: "experience", label: "Kinh nghiệm" },
  { key: "goals", label: "Mục tiêu" },
  { key: "style", label: "Phong cách" },
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
  const [confirmRec, setConfirmRec] = useState<NicheRecommendation | null>(null);

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
          throw new Error(data.error ?? "Lỗi khi phân tích");
        }

        const data = await res.json();
        setRecommendations(data.recommendations);
        setSummary(data.summary);
        setProfileId(data.profileId);
        setPhase("results");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi không xác định");
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

  const handleConfirmNiche = useCallback((rec: NicheRecommendation): void => {
    setConfirmRec(rec);
  }, []);

  const handleSelectNiche = useCallback(
    async (nicheKey: string, nicheLabel: string, reasoning?: string): Promise<void> => {
      setConfirmRec(null);
      try {
        // Check if channel with same niche already exists
        const checkRes = await fetch(`/api/channels?niche=${encodeURIComponent(nicheKey)}`);
        if (checkRes.ok) {
          const channels = await checkRes.json();
          const existing = Array.isArray(channels?.data)
            ? channels.data.find((ch: { niche?: string; isActive?: boolean }) => ch.niche === nicheKey && ch.isActive !== false)
            : null;
          if (existing) {
            await fetch("/api/niche-intelligence/select", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ profileId, selectedNiche: nicheKey, channelId: existing.id }),
            });
            sessionStorage.setItem("pastr-niche-profile-id", profileId);
            router.push(`/channels/${existing.id}`);
            return;
          }
        }

        // Use first sentence of reasoning as persona description (more descriptive than generic)
        const personaDesc = reasoning
          ? reasoning.split(/[.!。]/)[0].trim().slice(0, 200)
          : `Kênh affiliate ${nicheLabel} trên TikTok`;

        const res = await fetch("/api/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nicheLabel,
            niche: nicheKey,
            personaName: nicheLabel,
            personaDesc: personaDesc || `Kênh affiliate ${nicheLabel} trên TikTok`,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error ?? "Lỗi khi tạo kênh");
        }

        const channelRes = await res.json();
        const channelId = channelRes.data?.id ?? channelRes.id;

        if (!channelId) {
          throw new Error("Không nhận được ID kênh từ server");
        }

        const selectRes = await fetch("/api/niche-intelligence/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileId,
            selectedNiche: nicheKey,
            channelId,
          }),
        });

        if (!selectRes.ok) {
          console.error("[niche-finder] Failed to update NicheProfile");
        }

        sessionStorage.setItem("pastr-niche-profile-id", profileId);
        router.push(`/channels/${channelId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi khi tạo kênh");
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
          AI đang phân tích...
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Đang kết hợp dữ liệu thị trường với câu trả lời của bạn để tìm ngách phù hợp nhất
        </p>
      </div>
    );
  }

  // ─── Results phase ───
  if (phase === "results") {
    if (recommendations.length === 0) {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <SearchX className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">
            Không tìm thấy ngách phù hợp
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
            AI chưa thể đề xuất ngách dựa trên câu trả lời của bạn. Hãy thử lại với lựa chọn khác.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Thử lại
          </button>
        </div>
      );
    }

    return (
      <>
        <NicheRecommendations
          recommendations={recommendations}
          summary={summary}
          onSelect={handleConfirmNiche}
          onRetry={handleRetry}
        />
        <NicheConfirmDialog
          recommendation={confirmRec}
          onConfirm={(rec) => handleSelectNiche(rec.nicheKey, rec.nicheLabel, rec.reasoning)}
          onCancel={() => setConfirmRec(null)}
        />
      </>
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
          Quay lại
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
              Phân tích ngách
            </>
          ) : (
            <>
              Tiếp theo
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
