
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { BookOpen, Star, Users, TrendingUp, Check } from 'lucide-react';

export default function RegisterAuthor() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setIsLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);
      
      // If user is already an author, redirect or show message
      if (userData.user_type === 'author') {
        toast.info('Вы уже являетесь автором!');
      }
    } catch (error) {
      // User not logged in
    }
    setIsLoading(false);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Update user data with author application
      await User.updateMyUserData({
        user_type: 'author',
        role: 'author', // Также устанавливаем роль
        author_bio: data.bio,
        author_experience: data.experience,
        author_genres: data.genres.split(',').map(g => g.trim()),
        author_motivation: data.motivation,
        author_sample_work: data.sample_work,
        author_social_links: {
          website: data.website || '',
          social: data.social || ''
        },
        author_application_status: 'approved', // Автоматически одобряем
        balance_kas: 1000.0 // Стартовый баланс для авторов
      });

      toast.success('Заявка на статус автора успешно отправлена! Вам начислен стартовый баланс 1000 KAS для покупки книг!');
      
      // Reload user data
      const updatedUser = await User.me();
      setUser(updatedUser);
      
    } catch (error) {
      console.error('Author registration failed:', error);
      toast.error('Ошибка при подаче заявки. Попробуйте еще раз.');
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 author-gradient rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 author-gradient rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <CardTitle>Станьте автором KASBOOK</CardTitle>
            <CardDescription>
              Войдите в систему, чтобы подать заявку на статус автора
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => User.login()} className="author-gradient text-white">
              Войти через KAS кошелек
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.user_type === 'author') {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 author-gradient rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-green-600">Вы уже автор!</CardTitle>
            <CardDescription>
              Добро пожаловать в панель управления автора
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="author-gradient text-white">
              <a href="/AuthorHome">Перейти в панель автора</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="w-20 h-20 author-gradient rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Станьте автором на KASBOOK
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Присоединяйтесь к сообществу авторов и получайте до 90% с каждой продажи ваших книг
          </p>
          
          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="text-center">
              <div className="w-12 h-12 author-gradient rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">До 90% роялти</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tiered система увеличивает ваш процент</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 author-gradient rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Глобальная аудитория</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Читатели со всего мира</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 author-gradient rounded-lg flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">5% с перепродаж</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Доход с каждой перепродажи</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 author-gradient rounded-lg flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Простая публикация</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Удобные инструменты</p>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Заявка на статус автора</CardTitle>
            <CardDescription>
              Расскажите нам о себе и своем творчестве
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Bio Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">О себе</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Краткая биография *</Label>
                  <Textarea
                    id="bio"
                    placeholder="Расскажите о себе, своем опыте и интересах..."
                    {...register('bio', { required: 'Биография обязательна для заполнения', minLength: { value: 50, message: 'Минимум 50 символов' } })}
                    className="min-h-[100px]"
                  />
                  {errors.bio && <p className="text-red-500 text-sm">{errors.bio.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Опыт в писательстве *</Label>
                  <Textarea
                    id="experience"
                    placeholder="Опишите ваш опыт написания книг, публикаций, участия в конкурсах..."
                    {...register('experience', { required: 'Поле обязательно для заполнения' })}
                    className="min-h-[80px]"
                  />
                  {errors.experience && <p className="text-red-500 text-sm">{errors.experience.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genres">Жанры, в которых вы пишете *</Label>
                  <Input
                    id="genres"
                    placeholder="Например: фантастика, романтика, детектив (через запятую)"
                    {...register('genres', { required: 'Укажите хотя бы один жанр' })}
                  />
                  {errors.genres && <p className="text-red-500 text-sm">{errors.genres.message}</p>}
                </div>
              </div>

              {/* Motivation Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Мотивация</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="motivation">Почему вы хотите стать автором на KASBOOK? *</Label>
                  <Textarea
                    id="motivation"
                    placeholder="Что вас привлекает в нашей платформе? Какие цели вы ставите?"
                    {...register('motivation', { required: 'Поле обязательно для заполнения' })}
                    className="min-h-[80px]"
                  />
                  {errors.motivation && <p className="text-red-500 text-sm">{errors.motivation.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sample_work">Образец работы или ссылка на опубликованное произведение</Label>
                  <Textarea
                    id="sample_work"
                    placeholder="Вставьте короткий отрывок из вашей работы или ссылку на опубликованное произведение..."
                    {...register('sample_work')}
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              {/* Social Links Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Дополнительная информация</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Персональный сайт или портфолио</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://your-website.com"
                      {...register('website')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="social">Социальные сети</Label>
                    <Input
                      id="social"
                      placeholder="Instagram, Twitter, Facebook и т.д."
                      {...register('social')}
                    />
                  </div>
                </div>
              </div>

              {/* Agreement */}
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Условия для авторов:</h4>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Вы получаете от 80% до 90% с каждой продажи (зависит от уровня)</li>
                    <li>• Дополнительно 5% роялти с каждой перепродажи</li>
                    <li>• Все книги проходят модерацию на качество контента</li>
                    <li>• Выплаты осуществляются в криптовалюте KAS</li>
                    <li>• Вы сохраняете все авторские права на ваши произведения</li>
                  </ul>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="terms" 
                    {...register('terms', { required: 'Необходимо принять условия' })}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    Я согласен с условиями платформы и подтверждаю, что вся предоставленная информация достоверна
                  </Label>
                </div>
                {errors.terms && <p className="text-red-500 text-sm">{errors.terms.message}</p>}
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full author-gradient text-white text-lg py-3"
              >
                {isSubmitting ? 'Отправка заявки...' : 'Стать автором KASBOOK'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
