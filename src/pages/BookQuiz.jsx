import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Book } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { useTranslation } from '../components/i18n/SimpleI18n';
import { getCoverOrPlaceholder } from '@/lib/books/coverImages';

const quizQuestions = [
  {
    question: 'Какое у вас сейчас настроение?',
    answers: [
      { text: 'Ищу приключений', value: 'fantasy' },
      { text: 'Хочу подумать о жизни', value: 'philosophy' },
      { text: 'Нужно что-то для бизнеса', value: 'business' },
      { text: 'Романтическое', value: 'romance' },
    ],
    key: 'genre'
  },
  {
    question: 'Какой объем книги предпочитаете?',
    answers: [
      { text: 'Короткую, на один вечер', value: 'short' },
      { text: 'Среднюю, на пару дней', value: 'medium' },
      { text: 'Длинную, чтобы погрузиться', value: 'long' },
    ],
    key: 'length'
  },
  {
    question: 'Что для вас важнее в книге?',
    answers: [
      { text: 'Захватывающий сюжет', value: 'plot' },
      { text: 'Глубокие персонажи', value: 'characters' },
      { text: 'Новые знания и факты', value: 'non-fiction' },
    ],
    key: 'focus'
  }
];

export default function BookQuiz() {
  const { t } = useTranslation();
  const [step, setStep] = useState(-1); // -1 for welcome screen
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    if (step < quizQuestions.length - 1) {
      setStep(step + 1);
    } else {
      findBook({ ...answers, [key]: value });
    }
  };
  
  const findBook = async (finalAnswers) => {
    setIsLoading(true);
    setStep(step + 1);
    
    // В реальном приложении логика была бы сложнее
    const filters = {};
    if(finalAnswers.genre) filters.genre = finalAnswers.genre;
    if(finalAnswers.focus === 'non-fiction') filters.genre = 'non-fiction';

    try {
        await new Promise(res => setTimeout(res, 1500)); // Simulate AI thinking
        const books = await Book.filter(filters, '-rating', 5);
        if(books.length > 0) {
            setResult(books[Math.floor(Math.random() * books.length)]);
        } else {
            const anyBook = await Book.list('-rating', 1);
            setResult(anyBook.length > 0 ? anyBook[0] : null);
        }
    } catch (e) {
        console.error(e)
        setResult(null)
    }
    
    setIsLoading(false);
  }

  const restartQuiz = () => {
    setStep(-1);
    setAnswers({});
    setResult(null);
  };

  const progress = step >= 0 ? ((step + 1) / quizQuestions.length) * 100 : 0;
  const currentQuestion = quizQuestions[step];

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-xl shadow-2xl overflow-hidden">
        {step === -1 && (
          <div>
            <CardHeader className="text-center p-8">
              <Sparkles className="mx-auto w-12 h-12 text-yellow-500 mb-4" />
              <CardTitle className="text-2xl">{t('quiz.title')}</CardTitle>
              <CardDescription>{t('quiz.description')}</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Button className="w-full" size="lg" onClick={() => setStep(0)}>
                {t('quiz.start')}
              </Button>
            </CardContent>
          </div>
        )}

        {step >= 0 && step < quizQuestions.length && (
          <div>
            <CardHeader>
              {step > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-4 left-4" 
                  onClick={() => setStep(step-1)}
                >
                  <ChevronLeft/> Назад
                </Button>
              )}
              <Progress value={progress} className="my-4" />
              <CardTitle>{currentQuestion.question}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {currentQuestion.answers.map(answer => (
                <Button 
                  key={answer.value} 
                  variant="outline" 
                  className="w-full justify-start h-12 text-base" 
                  onClick={() => handleAnswer(currentQuestion.key, answer.value)}
                >
                  {answer.text}
                </Button>
              ))}
            </CardContent>
          </div>
        )}
        
        {step === quizQuestions.length && (
          <div className="p-8">
            <CardHeader className="text-center">
              <CardTitle>Ваша идеальная книга!</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-8 gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Подбираем книгу...</p>
                </div>
              ) : result ? (
                <div className="flex flex-col items-center gap-4">
                  <img 
                    src={getCoverOrPlaceholder(result, `https://picsum.photos/seed/${result.id}/300/400`)}
                    alt={result.title} 
                    className="w-40 h-60 object-cover rounded-lg shadow-lg" 
                  />
                  <h3 className="text-xl font-bold">{result.title}</h3>
                  <p className="text-muted-foreground">{result.author}</p>
                  <div className="flex gap-4 mt-4">
                    <Button asChild>
                      <Link to={createPageUrl(`BookDetails?id=${result.id}`)}>
                        Подробнее
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={restartQuiz}>
                      Пройти еще раз
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="mb-4">Не удалось найти книгу. Попробуйте еще раз.</p>
                  <Button variant="outline" onClick={restartQuiz}>
                    Пройти еще раз
                  </Button>
                </div>
              )}
            </CardContent>
          </div>
        )}
      </Card>
    </div>
  );
}