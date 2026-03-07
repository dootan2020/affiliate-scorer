"use client";

import {
  Sparkles,
  ShoppingBag,
  UtensilsCrossed,
  Home,
  Heart,
  Smartphone,
  Baby,
  PawPrint,
  Pencil,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionnaireAnswers } from "@/lib/niche-intelligence/types";

// ─── Shared selection card ───

function SelectionCard({
  selected,
  onClick,
  icon,
  label,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description?: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center",
        "hover:shadow-md hover:-translate-y-0.5",
        selected
          ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 shadow-sm"
          : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-600"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          selected
            ? "bg-orange-500 text-white"
            : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400"
        )}
      >
        {icon}
      </div>
      <span
        className={cn(
          "text-sm font-medium",
          selected
            ? "text-orange-700 dark:text-orange-300"
            : "text-gray-700 dark:text-gray-300"
        )}
      >
        {label}
      </span>
      {description && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </span>
      )}
    </button>
  );
}

// ─── Step 1: Interests ───

const NICHE_OPTIONS = [
  { key: "beauty_skincare", label: "Làm đẹp & Skincare", icon: <Sparkles className="w-5 h-5" /> },
  { key: "fashion", label: "Thời trang", icon: <ShoppingBag className="w-5 h-5" /> },
  { key: "food", label: "Đồ ăn & Đồ uống", icon: <UtensilsCrossed className="w-5 h-5" /> },
  { key: "home_living", label: "Đồ gia dụng", icon: <Home className="w-5 h-5" /> },
  { key: "health", label: "Sức khỏe", icon: <Heart className="w-5 h-5" /> },
  { key: "tech", label: "Công nghệ", icon: <Smartphone className="w-5 h-5" /> },
  { key: "mom_baby", label: "Mẹ và bé", icon: <Baby className="w-5 h-5" /> },
  { key: "pet", label: "Thú cưng", icon: <PawPrint className="w-5 h-5" /> },
  { key: "stationery", label: "Văn phòng phẩm", icon: <Pencil className="w-5 h-5" /> },
  { key: "lifestyle", label: "Phong cách sống", icon: <Compass className="w-5 h-5" /> },
];

export function StepInterests({
  answers,
  onChange,
}: {
  answers: QuestionnaireAnswers;
  onChange: (answers: QuestionnaireAnswers) => void;
}): React.ReactElement {
  const toggle = (key: string): void => {
    const interests = answers.interests.includes(key)
      ? answers.interests.filter((i) => i !== key)
      : [...answers.interests, key];
    onChange({ ...answers, interests });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
          Bạn quan tâm lĩnh vực nào?
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Chọn 1 hoặc nhiều lĩnh vực bạn muốn làm affiliate
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {NICHE_OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.key}
            selected={answers.interests.includes(opt.key)}
            onClick={() => toggle(opt.key)}
            icon={opt.icon}
            label={opt.label}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Experience ───

const EXPERIENCE_OPTIONS = [
  { key: "beginner" as const, label: "Mới bắt đầu", description: "Chưa từng làm affiliate" },
  { key: "intermediate" as const, label: "Có kinh nghiệm", description: "Đã làm 3-6 tháng" },
  { key: "expert" as const, label: "Chuyên nghiệp", description: "Đã có thu nhập ổn định" },
];

export function StepExperience({
  answers,
  onChange,
}: {
  answers: QuestionnaireAnswers;
  onChange: (answers: QuestionnaireAnswers) => void;
}): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
          Kinh nghiệm của bạn?
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Giúp AI gợi ý ngách phù hợp với trình độ
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {EXPERIENCE_OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.key}
            selected={answers.experience === opt.key}
            onClick={() => onChange({ ...answers, experience: opt.key })}
            icon={
              <span className="text-lg font-bold">
                {opt.key === "beginner" ? "1" : opt.key === "intermediate" ? "2" : "3"}
              </span>
            }
            label={opt.label}
            description={opt.description}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Step 3: Goals ───

const GOAL_OPTIONS = [
  { key: "passive_income", label: "Thu nhập thụ động", description: "Kiếm thêm ngoài giờ" },
  { key: "full_time", label: "Làm full-time", description: "Nghỉ việc, làm affiliate chính" },
  { key: "brand_building", label: "Xây thương hiệu", description: "Xây kênh cá nhân lâu dài" },
  { key: "quick_money", label: "Kiếm tiền nhanh", description: "Muốn có thu nhập sớm" },
];

const BUDGET_OPTIONS = [
  { key: "zero" as const, label: "Không có", description: "Chỉ organic" },
  { key: "low" as const, label: "< 1 triệu", description: "Ngân sách thấp" },
  { key: "medium" as const, label: "1-5 triệu", description: "Đầu tư vừa phải" },
  { key: "high" as const, label: "> 5 triệu", description: "Đầu tư mạnh" },
];

export function StepGoals({
  answers,
  onChange,
}: {
  answers: QuestionnaireAnswers;
  onChange: (answers: QuestionnaireAnswers) => void;
}): React.ReactElement {
  const toggleGoal = (key: string): void => {
    const goals = answers.goals.includes(key)
      ? answers.goals.filter((g) => g !== key)
      : [...answers.goals, key];
    onChange({ ...answers, goals });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
          Mục tiêu của bạn?
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Chọn 1 hoặc nhiều mục tiêu
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {GOAL_OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.key}
            selected={answers.goals.includes(opt.key)}
            onClick={() => toggleGoal(opt.key)}
            icon={<span className="text-base">&#127919;</span>}
            label={opt.label}
            description={opt.description}
          />
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
          Ngân sách hàng tháng?
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Cho quảng cáo và công cụ
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {BUDGET_OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.key}
            selected={answers.budget === opt.key}
            onClick={() => onChange({ ...answers, budget: opt.key })}
            icon={<span className="text-base">&#128176;</span>}
            label={opt.label}
            description={opt.description}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Step 4: Content Style ───

const STYLE_OPTIONS = [
  { key: "entertaining", label: "Giải trí", description: "Hài hước, thú vị, viral" },
  { key: "educational", label: "Chia sẻ kiến thức", description: "Hướng dẫn, tips, review sâu" },
  { key: "review", label: "Review sản phẩm", description: "Đánh giá, so sánh, unbox" },
  { key: "lifestyle", label: "Phong cách sống", description: "Cuộc sống hàng ngày, vlog" },
];

export function StepStyle({
  answers,
  onChange,
}: {
  answers: QuestionnaireAnswers;
  onChange: (answers: QuestionnaireAnswers) => void;
}): React.ReactElement {
  const toggleStyle = (key: string): void => {
    const contentStyle = answers.contentStyle.includes(key)
      ? answers.contentStyle.filter((s) => s !== key)
      : [...answers.contentStyle, key];
    onChange({ ...answers, contentStyle });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
          Phong cách nội dung?
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Chọn phong cách bạn muốn làm (có thể chọn nhiều)
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STYLE_OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.key}
            selected={answers.contentStyle.includes(opt.key)}
            onClick={() => toggleStyle(opt.key)}
            icon={<span className="text-base">&#127916;</span>}
            label={opt.label}
            description={opt.description}
          />
        ))}
      </div>
    </div>
  );
}
