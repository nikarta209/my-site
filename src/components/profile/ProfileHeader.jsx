import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit, X, User } from 'lucide-react';

export default function ProfileHeader({ user, onEditClick, isEditing }) {
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <Avatar className="w-20 h-20 border-2 border-amber-300 dark:border-slate-700">
          <AvatarImage src={user.avatar_url} alt={user.full_name} />
          <AvatarFallback className="bg-amber-200 dark:bg-slate-800 text-amber-900 dark:text-slate-300 text-2xl">
            {getInitials(user.full_name)}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      <div className="flex-grow">
        <h2 className="text-2xl font-bold text-amber-900 dark:text-white">{user.full_name || 'Пользователь'}</h2>
        <p className="text-sm text-amber-700 dark:text-slate-400">{user.email}</p>
        {user.bio && (
          <p className="text-sm text-amber-600 dark:text-slate-500 mt-2 italic">{user.bio}</p>
        )}
      </div>

      <motion.div whileTap={{ scale: 0.95 }}>
        <Button 
            variant="outline" 
            className="border-amber-300 dark:border-slate-700 hover:bg-amber-100 dark:hover:bg-slate-800 text-amber-800 dark:text-slate-300 focus:ring-blue-500"
            onClick={onEditClick}
            aria-label={isEditing ? 'Отменить редактирование' : 'Редактировать профиль'}
        >
          {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
          {isEditing ? 'Отмена' : 'Редактировать'}
        </Button>
      </motion.div>
    </div>
  );
}