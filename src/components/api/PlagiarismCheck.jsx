import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { InvokeLLM } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Search, Loader2, BarChart, Percent, AlertTriangle } from 'lucide-react';

export default function PlagiarismCheck({ textToCheck }) {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheck = async () => {
    if (!textToCheck || textToCheck.trim().length < 100) {
      toast.warning('Требуется текст длиной не менее 100 символов для анализа.');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const prompt = `
        Analyze the following text for potential plagiarism. Provide a percentage score, a risk level (Low, Medium, High), and a brief explanation.

        Text to analyze:
        """
        ${textToCheck.substring(0, 8000)} 
        """

        Your response must be a single JSON object with the keys "percentage", "risk", and "explanation".
        - "percentage" must be a number between 0 and 100.
        - "risk" must be one of "Low", "Medium", or "High".
        - "explanation" must be a short string.
      `;

      const llmResponse = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            percentage: { type: "number" },
            risk: { type: "string", enum: ["Low", "Medium", "High"] },
            explanation: { type: "string" }
          },
          required: ["percentage", "risk", "explanation"]
        }
      });

      setResult(llmResponse);
      toast.success('Анализ на плагиат завершен.');

    } catch (error) {
      console.error("Plagiarism check failed:", error);
      toast.error('Ошибка анализа. Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    if (risk === 'High') return 'bg-red-500';
    if (risk === 'Medium') return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const getProgressColorClass = (percentage) => {
    if (percentage > 75) return 'bg-red-500';
    if (percentage > 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleCheck} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Анализ...
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            Проверить на плагиат
          </>
        )}
      </Button>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert>
            <div className={`w-5 h-5 ${getRiskColor(result.risk)} rounded-full flex items-center justify-center`}>
                <Percent size={14} className="text-white"/>
            </div>
            <AlertTitle>Риск плагиата: {result.risk}</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p>{result.explanation}</p>
              <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Степень заимствования</span>
                    <span className="font-bold text-lg">{result.percentage.toFixed(0)}%</span>
                </div>
                <Progress value={result.percentage} indicatorClassName={getProgressColorClass(result.percentage)} />
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </div>
  );
}