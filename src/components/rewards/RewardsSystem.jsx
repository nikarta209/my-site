import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Gift, 
  Coins, 
  Star, 
  TrendingUp, 
  Award,
  BookOpen,
  Heart,
  ShoppingCart,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { rewardsStorage } from '../utils/localStorage';
import { User } from '@/api/entities';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Mock KAS minting для наград
const mockKASMint = {
  async mintReward(userEmail, amount, activity) {
    // Симуляция процесса mint KAS токенов
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const txHash = `reward_tx_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    return {
      success: true,
      txHash,
      amount,
      activity,
      timestamp: Date.now()
    };
  }
};

// Типы активностей и их награды
const ACTIVITY_REWARDS = {
  PURCHASE: { reward: 0.1, description: 'Покупка книги', icon: ShoppingCart },
  REVIEW: { reward: 0.1, description: 'Написание отзыва', icon: MessageSquare },
  WISHLIST_ADD: { reward: 0.05, description: 'Добавление в wishlist', icon: Heart },
  BOOK_UPLOAD: { reward: 0.2, description: 'Публикация книги', icon: BookOpen },
  DAILY_LOGIN: { reward: 0.05, description: 'Ежедневный вход', icon: Star },
  PROFILE_COMPLETE: { reward: 0.15, description: 'Заполнение профиля', icon: Award }
};

const RewardActivityIcon = ({ type }) => {
  const IconComponent = ACTIVITY_REWARDS[type]?.icon || Gift;
  return <IconComponent className="w-4 h-4" />;
};

export const useRewards = () => {
  const [userRewards, setUserRewards] = useState({ totalEarned: 0, activities: [] });

  const addReward = async (userEmail, activityType, customReward = null) => {
    try {
      const activityConfig = ACTIVITY_REWARDS[activityType];
      if (!activityConfig && !customReward) {
        console.warn(`Unknown activity type: ${activityType}`);
        return;
      }

      const reward = customReward || activityConfig.reward;
      const description = customReward ? 
        customReward.description : 
        activityConfig.description;

      // Добавляем активность в локальное хранилище
      const activityRecord = rewardsStorage.addActivity(userEmail, {
        type: activityType,
        reward,
        description
      });

      // Mock mint KAS токенов
      const mintResult = await mockKASMint.mintReward(userEmail, reward, {
        type: activityType,
        description
      });

      if (mintResult.success) {
        // Обновляем баланс пользователя
        try {
          const currentUser = await User.me();
          const newBalance = (currentUser.balance_kas || 0) + reward;
          
          await User.updateMyUserData({
            balance_kas: newBalance
          });

          toast.success(`+${reward} KAS награда!`, {
            description: description,
            duration: 3000
          });

          // Обновляем локальное состояние
          setUserRewards(rewardsStorage.getUserRewards(userEmail));

        } catch (error) {
          console.error('Error updating user balance:', error);
        }
      }

      return activityRecord;

    } catch (error) {
      console.error('Error adding reward:', error);
      toast.error('Ошибка при начислении награды');
    }
  };

  const getUserRewards = (userEmail) => {
    const rewards = rewardsStorage.getUserRewards(userEmail);
    setUserRewards(rewards);
    return rewards;
  };

  return {
    addReward,
    getUserRewards,
    userRewards
  };
};

export default function RewardsSystem({ user, className = '' }) {
  const { userRewards, getUserRewards } = useRewards();
  const [showAllActivities, setShowAllActivities] = useState(false);

  useEffect(() => {
    if (user?.email) {
      getUserRewards(user.email);
    }
  }, [user?.email, getUserRewards]);

  const recentActivities = showAllActivities ? 
    userRewards.activities : 
    userRewards.activities.slice(0, 5);

  const todayRewards = userRewards.activities.filter(activity => {
    const today = new Date();
    const activityDate = new Date(activity.timestamp);
    return activityDate.toDateString() === today.toDateString();
  }).reduce((sum, activity) => sum + activity.reward, 0);

  if (!user) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Rewards Summary */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-600" />
            Система наград
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {userRewards.totalEarned.toFixed(2)} KAS
              </div>
              <div className="text-sm text-muted-foreground">Всего заработано</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                +{todayRewards.toFixed(2)} KAS
              </div>
              <div className="text-sm text-muted-foreground">Сегодня</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {userRewards.activities.length}
              </div>
              <div className="text-sm text-muted-foreground">Активностей</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-600" />
            Доступные награды
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(ACTIVITY_REWARDS).map(([type, config]) => (
              <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <RewardActivityIcon type={type} />
                  </div>
                  <div>
                    <div className="font-medium">{config.description}</div>
                    <div className="text-sm text-muted-foreground">
                      +{config.reward} KAS
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  +{config.reward}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      {userRewards.activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                История наград
              </div>
              {userRewards.activities.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllActivities(!showAllActivities)}
                >
                  {showAllActivities ? 'Скрыть' : `Показать все (${userRewards.activities.length})`}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <RewardActivityIcon type={activity.type} />
                    </div>
                    <div>
                      <div className="font-medium">{activity.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(activity.timestamp), 'dd MMM yyyy, HH:mm', { locale: ru })}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    +{activity.reward} KAS
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}