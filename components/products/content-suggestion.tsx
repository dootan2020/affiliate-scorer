import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gợi ý nội dung</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Chưa có gợi ý nội dung. Hãy chạy phân tích AI để nhận đề xuất.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {hasSuggestion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gợi ý nội dung AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {parseSection(suggestion).map((section, i) => (
              <div key={i}>
                {section.title && (
                  <p className="text-sm font-semibold text-foreground mb-0.5">
                    {section.title}
                  </p>
                )}
                {section.body && (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {section.body}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {hasAdvice && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chiến lược nền tảng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {parseSection(platformAdvice).map((section, i) => (
              <div key={i}>
                {section.title && (
                  <p className="text-sm font-semibold text-foreground mb-0.5">
                    {section.title}
                  </p>
                )}
                {section.body && (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {section.body}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
