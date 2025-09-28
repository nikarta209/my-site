import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, ProtectedRoute } from '../components/auth/Auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Share2, 
  Copy, 
  UserPlus,
  Award,
  BarChart3,
  Clock
} from 'lucide-react';
import { ReferralTransaction } from '@/api/entities';
import { User } from '@/api/entities';
import { toast } from 'sonner';

export default function ReferralDashboard() {
  const { user } = useAuth();
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0,
    monthlyEarnings: 0
  });
  const [referralTransactions, setReferralTransactions] = useState([]);
  const [myReferrals, setMyReferrals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const referralLink = user?.referral_code 
    ? `${window.location.origin}/register?ref=${user.referral_code}`
    : '';

  const loadReferralData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Загружаем транзакции рефералов
      const transactions = await ReferralTransaction.filter({ 
        referrer_email: user.email 
      }, '-created_date', 100);
      setReferralTransactions(transactions || []);

      // Загружаем список рефералов
      const referrals = await User.filter({ 
        referred_by: user.email 
      }, '-created_date', 50);
      setMyReferrals(referrals || []);

      // Рассчитываем статистику
      const totalEarnings = transactions.reduce((sum, t) => sum + (t.referrer_commission_kas || 0), 0);
      const currentMonth = new Date().getMonth();
      const monthlyEarnings = transactions
        .filter(t => new Date(t.created_date).getMonth() === currentMonth)
        .reduce((sum, t) => sum + (t.referrer_commission_kas || 0), 0);

      setReferralStats({
        totalReferrals: referrals.length,
        activeReferrals: referrals.filter(r => r.active_referrals > 0).length,
        totalEarnings,
        monthlyEarnings
      });

    } catch (error) {
      console.error('Ошибка загрузки реферальных данных:', error);
      toast.error('Не удалось загрузить данные рефералов');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadReferralData();
  }, [loadReferralData]);

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Реферальная ссылка скопирована!');
  };

  const generateNewReferralCode = async () => {
    try {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await User.updateMyUserData({ referral_code: newCode });
      toast.success('Новый реферальный код создан!');
      window.location.reload();
    } catch (error) {
      toast.error('Ошибка создания нового кода');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Реферальная программа
                </h1>
                <p className="text-muted-foreground">
                  Приглашайте друзей и зарабатывайте 5% с их покупок
                </p>
              </div>
              
              <Badge variant="outline" className="border-green-200 text-green-700">
                <Award className="w-4 h-4 mr-1" />
                Активен
              </Badge>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                title: 'Всего рефералов',
                value: referralStats.totalReferrals,
                icon: Users,
                color: 'text-blue-600',
                bgColor: 'bg-blue-100'
              },
              {
                title: 'Активные рефералы',
                value: referralStats.activeReferrals,
                icon: UserPlus,
                color: 'text-green-600',
                bgColor: 'bg-green-100'
              },
              {
                title: 'Общий доход',
                value: `${referralStats.totalEarnings.toFixed(2)} KAS`,
                icon: DollarSign,
                color: 'text-purple-600',
                bgColor: 'bg-purple-100'
              },
              {
                title: 'Доход за месяц',
                value: `${referralStats.monthlyEarnings.toFixed(2)} KAS`,
                icon: TrendingUp,
                color: 'text-orange-600',
                bgColor: 'bg-orange-100'
              }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                          </p>
                          <p className="text-2xl font-bold text-foreground">
                            {stat.value}
                          </p>
                        </div>
                        <div className={`p-3 rounded-full ${stat.bgColor}`}>
                          <Icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 mb-8">
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="link">Ссылка</TabsTrigger>
              <TabsTrigger value="referrals">Рефералы</TabsTrigger>
              <TabsTrigger value="earnings">Доходы</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Как это работает</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                      <div>
                        <h4 className="font-semibold">Поделитесь ссылкой</h4>
                        <p className="text-sm text-muted-foreground">Отправьте друзьям вашу реферальную ссылку</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      <div>
                        <h4 className="font-semibold">Друзья регистрируются</h4>
                        <p className="text-sm text-muted-foreground">Они создают аккаунт по вашей ссылке</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      <div>
                        <h4 className="font-semibold">Вы зарабатываете</h4>
                        <p className="text-sm text-muted-foreground">Получаете 5% с каждой их покупки</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Условия программы</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Комиссия с покупок:</span>
                      <span className="font-semibold text-green-600">5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Минимальная выплата:</span>
                      <span className="font-semibold">10 KAS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Срок действия:</span>
                      <span className="font-semibold">Безлимитный</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Выплаты:</span>
                      <span className="font-semibold">Мгновенные</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="link">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Ваша реферальная ссылка
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      value={referralLink} 
                      readOnly 
                      className="font-mono text-sm"
                    />
                    <Button onClick={copyReferralLink}>
                      <Copy className="w-4 h-4 mr-2" />
                      Копировать
                    </Button>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Ваш реферальный код: <span className="font-mono font-bold">{user?.referral_code}</span>
                    </p>
                    <Button variant="outline" onClick={generateNewReferralCode}>
                      Создать новый код
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                    {['WhatsApp', 'Telegram', 'VK'].map(platform => (
                      <Button key={platform} variant="outline" className="flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        {platform}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="referrals">
              <Card>
                <CardHeader>
                  <CardTitle>Ваши рефералы ({myReferrals.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {myReferrals.map((referral, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-semibold">{referral.full_name || 'Пользователь'}</p>
                          <p className="text-sm text-muted-foreground">{referral.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Зарегистрирован: {new Date(referral.created_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={referral.active_referrals > 0 ? 'default' : 'secondary'}>
                            {referral.active_referrals > 0 ? 'Активен' : 'Неактивен'}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            Покупок: {referral.active_referrals || 0}
                          </p>
                        </div>
                      </div>
                    ))}
                    {myReferrals.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>У вас пока нет рефералов</p>
                        <p className="text-sm">Поделитесь ссылкой с друзьями!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earnings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    История доходов
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {referralTransactions.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-semibold">+{transaction.referrer_commission_kas.toFixed(2)} KAS</p>
                          <p className="text-sm text-muted-foreground">
                            Покупка от {transaction.referee_email}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(transaction.created_date).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">
                            {transaction.commission_rate}%
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            Сумма: {transaction.purchase_amount_kas.toFixed(2)} KAS
                          </p>
                        </div>
                      </div>
                    ))}
                    {referralTransactions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Доходов пока нет</p>
                        <p className="text-sm">Приглашайте друзей для получения комиссий!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}