export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  label: string;
  gender: 'male' | 'female';
}

export function getAvailableVoices(): VoiceOption[] {
  const voices = speechSynthesis.getVoices();
  const categorized: VoiceOption[] = [];

  // Common female voice name patterns
  const femaleNames = ['female', 'woman', 'girl', 'zira', 'hazel', 'susan', 'samantha', 'karen', 'moira', 'tessa', 'fiona', 'victoria', 'allison', 'ava', 'joana', 'sara', 'nicky', 'kate', 'ellen', 'helena', 'anna'];
  const maleNames = ['male', 'man', 'boy', 'david', 'mark', 'james', 'daniel', 'thomas', 'fred', 'alex', 'oliver', 'george', 'aaron', 'reed', 'evan', 'luca', 'rishi'];

  for (const voice of voices) {
    const nameLower = voice.name.toLowerCase();
    let gender: 'male' | 'female' | null = null;

    if (femaleNames.some(n => nameLower.includes(n))) {
      gender = 'female';
    } else if (maleNames.some(n => nameLower.includes(n))) {
      gender = 'male';
    }

    if (gender) {
      categorized.push({
        voice,
        label: `${voice.name} (${voice.lang})`,
        gender,
      });
    }
  }

  // If no categorized voices, split all voices roughly
  if (categorized.length === 0 && voices.length > 0) {
    const half = Math.ceil(voices.length / 2);
    voices.forEach((voice, i) => {
      categorized.push({
        voice,
        label: `${voice.name} (${voice.lang})`,
        gender: i < half ? 'female' : 'male',
      });
    });
  }

  return categorized;
}

export function speak(
  text: string,
  voice: SpeechSynthesisVoice,
  options?: {
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
    onBoundary?: (charIndex: number) => void;
  }
): SpeechSynthesisUtterance {
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.rate = options?.rate ?? 1;
  utterance.pitch = options?.pitch ?? 1;

  if (options?.onEnd) utterance.onend = options.onEnd;
  if (options?.onBoundary) {
    utterance.onboundary = (e) => options.onBoundary!(e.charIndex);
  }

  speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  speechSynthesis.cancel();
}

export function pauseSpeaking() {
  speechSynthesis.pause();
}

export function resumeSpeaking() {
  speechSynthesis.resume();
}
