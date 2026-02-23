import { Lightbulb, Globe } from "lucide-react";

interface ContentSuggestionProps {
  suggestion: string | null;
  platformAdvice: string | null;
}

function parseSection(text: string): Array<{ title: string; body: string }> {
  const lines = text.split("\n").filter((l) => l.trim());
  const sections: Array<{ title: string; body: string }> = [];
  let current: { title: string; body: string } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || trimmed.startsWith("**") || trimmed.endsWith(":")) {
      if (current) sections.push(current);
      current = {
        title: trimmed.replace(/^#+\s*/, "").replace(/\*\*/g, "").replace(/:$/, ""),
        body: "",
      };
    } else if (current) {
      current.body += (current.body ? "\n" : "") + trimmed;
    } else {
      if (sections.length === 0 && !current) {
        sections.push({ title: "", body: trimmed });
      } else {
        const last = sections[sections.length - 1];
        if (last) last.body += "\n" + trimmed;
      }
    }
  }
  if (current) sections.push(current);
  return sections.filter((s) => s.body || s.title);
}

export function ContentSuggestion({
  suggestion,
  platformAdvice,
}: ContentSuggestionProps): React.ReactElement {
  const hasSuggestion = suggestion && suggestion.trim().length > 0;
  const hasAdvice = platformAdvice && platformAdvice.trim().length > 0;

  if (!hasSuggestion && !hasAdvice) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center mb-4">
          <Lightbulb className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">Chưa có gợi ý nội dung</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Hãy chạy phân tích AI để nhận đề xuất.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {hasSuggestion && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Gợi ý nội dung AI</p>
          </div>
          <div className="space-y-3">
            {parseSection(suggestion).map((section, i) => (
              <div key={i}>
                {section.title && (
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-0.5">
                    {section.title}
                  </p>
                )}
                {section.body && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {section.body}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasAdvice && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-blue-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Chiến lược nền tảng</p>
          </div>
          <div className="space-y-3">
            {parseSection(platformAdvice).map((section, i) => (
              <div key={i}>
                {section.title && (
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-0.5">
                    {section.title}
                  </p>
                )}
                {section.body && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {section.body}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
