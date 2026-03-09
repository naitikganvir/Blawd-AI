import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { getAvailableVoices, speak, stopSpeaking, pauseSpeaking, resumeSpeaking, type VoiceOption } from '@/lib/voiceEngine';

interface VoicePlayerProps {
  text: string;
  fileName: string;
}

export function VoicePlayer({ text, fileName }: VoicePlayerProps) {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const loadVoices = () => {
      const v = getAvailableVoices();
      setVoices(v);
      const female = v.find(x => x.gender === 'female');
      if (female) setSelectedVoice(female);
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => { speechSynthesis.onvoiceschanged = null; };
  }, []);

  useEffect(() => {
    const filtered = voices.filter(v => v.gender === gender);
    if (filtered.length > 0) setSelectedVoice(filtered[0]);
  }, [gender, voices]);

  const filteredVoices = voices.filter(v => v.gender === gender);

  const handlePlay = useCallback(() => {
    if (isPaused) {
      resumeSpeaking();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    if (!selectedVoice) return;

    setProgress(0);
    setIsPlaying(true);
    setIsPaused(false);

    // Track progress with interval
    if (intervalRef.current) clearInterval(intervalRef.current);
    const totalChars = text.length;
    let currentChar = 0;

    speak(text, selectedVoice.voice, {
      rate,
      onEnd: () => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
        if (intervalRef.current) clearInterval(intervalRef.current);
      },
      onBoundary: (charIndex) => {
        currentChar = charIndex;
        setProgress(Math.min((charIndex / totalChars) * 100, 100));
      },
    });
  }, [selectedVoice, text, rate, isPaused]);

  const handlePause = () => {
    pauseSpeaking();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    stopSpeaking();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const wordCount = text.split(/\s+/).length;
  const estimatedMinutes = Math.ceil(wordCount / (150 * rate));

  return (
    <div className="w-full space-y-6">
      {/* File info */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Extracted from</p>
        <p className="font-display text-lg text-foreground">{fileName}</p>
        <p className="text-sm text-muted-foreground">{wordCount.toLocaleString()} words · ~{estimatedMinutes} min listen</p>
      </div>

      {/* Gender toggle */}
      <div>
        <p className="mb-3 font-display text-sm font-medium text-muted-foreground">Voice Gender</p>
        <div className="flex gap-2">
          {(['female', 'male'] as const).map(g => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`flex-1 rounded-lg border px-6 py-3 font-display text-sm font-semibold transition-all ${
                gender === g
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-secondary text-secondary-foreground hover:border-primary/50'
              }`}
            >
              {g === 'female' ? '👩 Female' : '👨 Male'}
            </button>
          ))}
        </div>
      </div>

      {/* Voice selector */}
      {filteredVoices.length > 1 && (
        <div>
          <p className="mb-2 font-display text-sm font-medium text-muted-foreground">Choose Voice</p>
          <select
            value={selectedVoice?.voice.name || ''}
            onChange={(e) => {
              const v = filteredVoices.find(x => x.voice.name === e.target.value);
              if (v) setSelectedVoice(v);
            }}
            className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          >
            {filteredVoices.map(v => (
              <option key={v.voice.name} value={v.voice.name}>{v.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Speed */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-display text-sm font-medium text-muted-foreground">Speed</p>
          <span className="text-sm text-foreground">{rate}x</span>
        </div>
        <Slider
          value={[rate]}
          onValueChange={([v]) => setRate(v)}
          min={0.5}
          max={2}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Audio wave visualizer when playing */}
      {isPlaying && (
        <div className="flex items-center justify-center gap-1 py-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="wave-bar h-8 w-1 rounded-full bg-primary"
              style={{ animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={handleStop}
          variant="outline"
          size="icon"
          disabled={!isPlaying && !isPaused}
          className="h-12 w-12 rounded-full"
        >
          <Square className="h-5 w-5" />
        </Button>

        <button
          onClick={isPlaying ? handlePause : handlePlay}
          disabled={!selectedVoice}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
        </button>

        <div className="flex h-12 w-12 items-center justify-center">
          <Volume2 className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {/* Text preview */}
      <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-secondary/50 p-4">
        <p className="mb-2 font-display text-xs font-medium text-muted-foreground">TEXT PREVIEW</p>
        <p className="text-sm leading-relaxed text-secondary-foreground">{text.slice(0, 1500)}{text.length > 1500 ? '...' : ''}</p>
      </div>
    </div>
  );
}
