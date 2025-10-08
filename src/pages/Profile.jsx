import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../components/auth/Auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileHeader from '../components/profile/ProfileHeader';
import EditProfileForm from '../components/profile/EditProfileForm';
import UserActivity from '../components/profile/UserActivity';
import UserNotesTab from '../components/profile/UserNotesTab';
import AIPreferencesModal from '../components/subscription/AIPreferencesModal';
import { UserAIPreferences } from '@/api/entities';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Settings, MessageSquare, Activity, Users, Share2, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Profile() {
  const { user, isLoading, hasRole } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiPreferences, setAIPreferences] = useState(null);

  const isModerator = hasRole('admin') || hasRole('moderator');

  // ИСПРАВЛЕНО: Переместил хуки до условных return'ов
  // Загрузка AI предпочтений
  const loadAIPreferences = useCallback(async () => {
    if (!user?.email) return;
    try {
      const prefs = await UserAIPreferences.filter({ user_email: user.email });
      if (prefs.length > 0) {
        setAIPreferences(prefs[0]);
      } else {
        setAIPreferences(null); // Ensure it's null if no preferences found
      }
    } catch (error) {
      console.error('Error loading AI preferences:', error);
      setAIPreferences(null); // Reset on error
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.subscription_status === 'active') {
      loadAIPreferences();
    }
  }, [loadAIPreferences, user?.subscription_status]);

  const handleEditToggle = () => setIsEditing(!isEditing);
  
  const handleProfileUpdate = () => {
    setIsEditing(false);
  };

  // ИСПРАВЛЕНО: Условные return'ы после всех хуков
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20 bg-gray-50 dark:bg-slate-950 text-gray-700 dark:text-slate-300">
        <p>Пожалуйста, войдите, чтобы просмотреть свой профиль.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
        <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="bg-amber-50 dark:bg-slate-900 border-amber-200 dark:border-slate-800 shadow-lg rounded-xl overflow-hidden">
                <CardContent className="p-6">
                    <ProfileHeader user={user} onEditClick={handleEditToggle} isEditing={isEditing} />
                    
                    {/* Кнопка модерации для модераторов */}
                    {isModerator && !isEditing && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
                              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                                Панель модерации
                              </h3>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                Управление контентом и модерация книг
                              </p>
                            </div>
                          </div>
                          <Button asChild variant="outline" className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                            <Link to={createPageUrl('ModerationPage')}>
                              <Shield className="w-4 h-4 mr-2" />
                              Перейти к модерации
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Реферальная программа */}
                    {!isEditing && (
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                              <Share2 className="w-5 h-5 text-green-600 dark:text-green-300" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-green-900 dark:text-green-100">
                                Реферальная программа
                              </h3>
                              <p className="text-sm text-green-700 dark:text-green-300">
                                Приглашайте друзей и получайте бонусы
                              </p>
                            </div>
                          </div>
                          <Button asChild variant="outline" className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300">
                            <Link to={createPageUrl('ReferralDashboard')}>
                              <Users className="w-4 h-4 mr-2" />
                              Перейти
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* AI Настройки для подписчиков */}
                    {user?.subscription_status === 'active' && !isEditing && (
                      <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-full">
                              <Brain className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                                Настройки ИИ-рекомендаций
                              </h3>
                              <p className="text-sm text-purple-700 dark:text-purple-300">
                                {aiPreferences ? 'Персонализируйте свои рекомендации' : 'Настройте ИИ для лучших рекомендаций'}
                              </p>
                            </div>
                          </div>
                          <Button 
                            onClick={() => setShowAISettings(true)}
                            variant="outline" 
                            className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            {aiPreferences ? 'Изменить' : 'Настроить'}
                          </Button>
                        </div>
                      </div>
                    )}

                    <Separator className="my-8 bg-amber-200 dark:bg-slate-700" />

                    <AnimatePresence mode="wait">
                        {isEditing ? (
                            <motion.div
                                key="edit-form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <EditProfileForm user={user} onUpdate={handleProfileUpdate} onCancel={handleEditToggle} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="profile-content"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Tabs defaultValue="activity" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 bg-amber-100 dark:bg-slate-800">
                                        <TabsTrigger value="activity" className="data-[state=active]:bg-amber-200 dark:data-[state=active]:bg-slate-700 flex items-center gap-2">
                                            <Activity className="w-4 h-4" />
                                            Активность
                                        </TabsTrigger>
                                        <TabsTrigger value="notes" className="data-[state=active]:bg-amber-200 dark:data-[state=active]:bg-slate-700 flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4" />
                                            Мои заметки
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="activity" className="mt-6">
                                        <UserActivity user={user} />
                                    </TabsContent>
                                    <TabsContent value="notes" className="mt-6">
                                        <UserNotesTab user={user} />
                                    </TabsContent>
                                </Tabs>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
        
        {/* Модальное окно AI настроек */}
        <AIPreferencesModal
          isOpen={showAISettings}
          onClose={() => {
            setShowAISettings(false);
            loadAIPreferences(); // Reload preferences after closing, in case they were updated
          }}
          initialData={aiPreferences}
        />
    </div>
  );
}