import { useState, useCallback } from 'react';
import { BookOpen, Lightbulb, Star, HelpCircle, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { streamBookAi, type AiAction } from '@/lib/bookAi';
import ReactMarkdown from 'react-markdown';

interface BookLearningProps {
  text: string;
  fileName: string;
}

const TAB_CONFIG = [
  { value: 'summarize' as AiAction, label: 'Summary', icon: BookOpen, desc: 'Get a concise summary of the content' },
  { value: 'explain' as AiAction, label: 'Explain', icon: Lightbulb, desc: 'Difficult concepts explained simply' },
  { value: 'highlight' as AiAction, label: 'Key Points', icon: Star, desc: 'Important takeaways & highlights' },
  { value: 'quiz' as AiAction, label: 'Quiz', icon: HelpCircle, desc: 'Test your understanding' },
];

export function BookLearning({ text, fileName }: BookLearningProps) {
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<AiAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AiAction>('summarize');

  const handleAction = useCallback((action: AiAction) => {
    if (results[action] || loading) return;
    setError(null);
    setLoading(action);
    let content = '';

    streamBookAi({
      text,
      action,
      onDelta: (chunk) => {
        content += chunk;
        setResults(prev => ({ ...prev, [action]: content }));
      },
      onDone: () => setLoading(null),
      onError: (msg) => {
        setError(msg);
        setLoading(null);
      },
    });
  }, [text, results, loading]);

  return (
    <div className="w-full space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">AI Learning Mode</p>
        <p className="font-display text-lg text-foreground">{fileName}</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AiAction)}>
        <TabsList className="grid w-full grid-cols-4 bg-secondary">
          {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-1.5 text-xs sm:text-sm">
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_CONFIG.map(({ value, desc, icon: Icon }) => (
          <TabsContent key={value} value={value} className="mt-4">
            {!results[value] && loading !== value ? (
              <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border p-10 text-center">
                <Icon className="h-10 w-10 text-primary" />
                <p className="text-sm text-muted-foreground">{desc}</p>
                <Button
                  onClick={() => handleAction(value)}
                  disabled={!!loading}
                  className="gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                  Generate
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-6">
                {loading === value && !results[value] ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">AI is processing...</p>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-secondary-foreground prose-strong:text-foreground prose-li:text-secondary-foreground">
                    <ReactMarkdown>{results[value] || ''}</ReactMarkdown>
                    {loading === value && (
                      <span className="inline-block h-4 w-1.5 animate-pulse rounded-sm bg-primary" />
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
