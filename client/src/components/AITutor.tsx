import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Send, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface AITutorProps {
  contextQuestion: string;
  moduleTitle?: string;
  moduleSlug?: string;
}

export function AITutor({ contextQuestion, moduleTitle = "Training Module", moduleSlug = "general" }: AITutorProps) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);

  const askTutorMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await fetch("/api/training/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `Regarding this topic: "${contextQuestion}" - ${question}`,
          moduleTitle,
          moduleSlug
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return data.answer;
    },
    onSuccess: (data) => {
      setResponse(data);
      setQuery("");
    }
  });

  return (
    <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
          <Brain className="w-4 h-4" />
          ALLIO AI Tutor
        </CardTitle>
      </CardHeader>
      <CardContent>
        {response ? (
          <div className="text-sm text-slate-800 dark:text-cyan-50 mb-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
            {response}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-3">
            Ask ALLIO for a personalized clarification if you're stuck on this concept.
          </p>
        )}
        <div className="flex items-center gap-2">
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What part is confusing?"
            className="h-8 text-sm bg-white dark:bg-black/40 border-cyan-200 dark:border-cyan-900"
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                askTutorMutation.mutate(query);
              }
            }}
          />
          <Button 
            size="sm" 
            className="h-8 px-3 bg-cyan-600 hover:bg-cyan-700 text-white"
            disabled={!query.trim() || askTutorMutation.isPending}
            onClick={() => askTutorMutation.mutate(query)}
          >
            {askTutorMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
