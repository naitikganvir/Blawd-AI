import { useState, useCallback, useEffect } from 'react';
import blawdLogo from '@/assets/blawd-logo.webp';
import { FileUploadZone } from '@/components/FileUploadZone';
import { VoicePlayer } from '@/components/VoicePlayer';
import { BookLearning } from '@/components/BookLearning';
import { HistorySidebar } from '@/components/HistorySidebar';
import { BookOpen, Headphones, Zap, Brain } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'voice' | 'learn'>('voice');
  const { user } = useAuth();

  const saveSession = useCallback(async (text: string, name: string) => {
    if (!user) return;
    // Check if session with same file name exists
    const { data: existing } = await supabase
      .from('book_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('file_name', name)
      .limit(1);
    
    if (!existing || existing.length === 0) {
      await supabase.from('book_sessions').insert({
        user_id: user.id,
        file_name: name,
        extracted_text: text,
      });
    }
  }, [user]);

  const handleTextExtracted = (text: string, name: string) => {
    setExtractedText(text);
    setFileName(name);
    saveSession(text, name);
  };

  const handleSelectSession = (text: string, name: string) => {
    setExtractedText(text);
    setFileName(name);
    setMode('voice');
  };

  const handleNewUpload = () => {
    setExtractedText(null);
    setFileName('');
    setMode('voice');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <HistorySidebar
          onSelectSession={handleSelectSession}
          onNewUpload={handleNewUpload}
          activeFileName={extractedText ? fileName : null}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b border-border px-4 py-3 flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="font-display text-lg font-bold text-foreground">
              Blawd <span className="text-gradient">AI</span>
            </h1>
          </header>

          <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-10">
            {!extractedText ? (
              <div className="space-y-12">
                {/* Hero */}
                <div className="text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                    <img src={blawdLogo} alt="" className="h-10 w-10 invert" />
                  </div>
                  <h2 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                    Stop Reading.<br />
                    <span className="text-gradient">Start Understanding.</span>
                  </h2>
                  <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
                    Upload any book or document — listen in natural voice, get AI summaries, explanations, and quizzes to learn faster.
                  </p>
                </div>

                <FileUploadZone
                  onTextExtracted={handleTextExtracted}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                />

                <div className="grid gap-6 sm:grid-cols-4">
                  {[
                    { icon: BookOpen, title: 'Any Document', desc: 'PDF, TXT, and more' },
                    { icon: Headphones, title: 'Natural Voice', desc: 'Male & female options' },
                    { icon: Brain, title: 'AI Summaries', desc: 'Key points & explanations' },
                    { icon: Zap, title: 'Smart Quiz', desc: 'Test your understanding' },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="rounded-lg border border-border bg-card p-6 text-center">
                      <Icon className="mx-auto mb-3 h-8 w-8 text-primary" />
                      <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <button
                  onClick={handleNewUpload}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Upload another file
                </button>

                <div className="flex gap-2">
                  {([
                    { key: 'voice' as const, label: '🎧 Listen' },
                    { key: 'learn' as const, label: '🧠 Learn' },
                  ]).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setMode(key)}
                      className={`flex-1 rounded-lg border px-6 py-3 font-display text-sm font-semibold transition-all ${
                        mode === key
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-secondary text-secondary-foreground hover:border-primary/50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {mode === 'voice' ? (
                  <VoicePlayer text={extractedText} fileName={fileName} />
                ) : (
                  <BookLearning text={extractedText} fileName={fileName} />
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
