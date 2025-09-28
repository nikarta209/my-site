import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';
import { toast } from 'sonner';

export default function TTSControls({ textToRead }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const synth = window.speechSynthesis;

  const handleSpeak = () => {
    if (!synth) {
      toast.error("Синтез речи не поддерживается в вашем браузере.");
      return;
    }

    if (isSpeaking) {
      if (isPaused) {
        synth.resume();
        setIsPaused(false);
      } else {
        synth.pause();
        setIsPaused(true);
      }
    } else {
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onerror = (e) => {
        toast.error(`Ошибка синтеза речи: ${e.error}`);
        setIsSpeaking(false);
        setIsPaused(false);
      }
      synth.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleStop = () => {
    if (synth) {
      synth.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };
  
  useEffect(() => {
    // Очистка при размонтировании компонента
    return () => {
      if (synth) synth.cancel();
    };
  }, [synth]);

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleSpeak} variant="outline" size="icon" aria-label={isSpeaking && !isPaused ? "Пауза" : "Воспроизвести"}>
        {isSpeaking && !isPaused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button onClick={handleStop} variant="outline" size="icon" disabled={!isSpeaking} aria-label="Стоп">
        <Square className="h-4 w-4" />
      </Button>
    </div>
  );
}