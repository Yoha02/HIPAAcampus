import { Button } from "@/components/ui/button";

type SuggestedQuestionsProps = {
  questions: string[];
  onSelect: (question: string) => void | Promise<void>;
};

export function SuggestedQuestions({ questions, onSelect }: SuggestedQuestionsProps) {
  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">Try asking</p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question) => (
          <Button key={question} variant="outline" size="sm" onClick={() => onSelect(question)}>
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}
