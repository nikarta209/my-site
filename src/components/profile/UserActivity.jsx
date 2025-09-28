import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, Star, DollarSign } from 'lucide-react';

const StatCard = ({ icon, title, value, bgColor, textColor }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    transition={{ type: "spring", stiffness: 400, damping: 10 }}
    className={`${bgColor} rounded-lg p-4 shadow-sm border border-amber-200 dark:border-slate-700`}
  >
    <div className="flex items-start justify-start">
        {React.cloneElement(icon, { className: "w-6 h-6 text-amber-600 dark:text-slate-400" })}
    </div>
    <div className="mt-2">
        <h3 className={`text-2xl font-bold ${textColor}`}>{value}</h3>
        <p className="text-sm text-amber-700 dark:text-slate-300">{title}</p>
    </div>
  </motion.div>
);

export default function UserActivity({ user }) {
  const [stats, setStats] = useState({ books: 0, reviews: 0, income: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  
  useEffect(() => {
    // MOCK DATA для демонстрации
    setStats({ books: 12, reviews: 8, income: 42.50 });
    setRecentActivity([
      { type: 'Покупка', item: 'Книга о Космосе', date: '2023-10-26', detail: '$9.99' },
      { type: 'Отзыв', item: 'Искусство Войны', date: '2023-10-24', detail: '5 звезд' },
      { type: 'Чтение', item: 'Дюна', date: '2023-10-22', detail: 'Завершено на 75%' },
    ]);
  }, [user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const statCards = [
    { 
      icon: <BookOpen />, 
      title: "Книг в библиотеке", 
      value: stats.books,
      bgColor: "bg-amber-100 dark:bg-slate-800",
      textColor: "text-green-600 dark:text-green-500"
    },
    { 
      icon: <Star />, 
      title: "Оставлено отзывов", 
      value: stats.reviews,
      bgColor: "bg-yellow-100 dark:bg-slate-800",
      textColor: "text-yellow-600 dark:text-yellow-500"
    },
    { 
      icon: <DollarSign />, 
      title: "Доход KAS", 
      value: `$${stats.income.toFixed(2)}`,
      bgColor: "bg-green-100 dark:bg-slate-800",
      textColor: "text-green-600 dark:text-green-500"
    }
  ];

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h3 className="text-xl font-semibold mb-4 text-amber-900 dark:text-slate-200">Статистика</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((card, index) => (
            <StatCard 
              key={index}
              icon={card.icon}
              title={card.title}
              value={card.value}
              bgColor={card.bgColor}
              textColor={card.textColor}
            />
          ))}
        </div>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <h3 className="text-xl font-semibold mb-4 text-amber-900 dark:text-slate-200">Недавняя активность</h3>
        <div className="rounded-lg border border-amber-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
          <Table>
            <TableHeader>
              <TableRow className="bg-amber-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-800 border-b border-amber-200 dark:border-slate-700">
                <TableHead className="text-amber-900 dark:text-gray-300">Тип</TableHead>
                <TableHead className="text-amber-900 dark:text-gray-300">Название</TableHead>
                <TableHead className="text-amber-900 dark:text-gray-300">Дата</TableHead>
                <TableHead className="text-right text-amber-900 dark:text-gray-300">Детали</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                <TableRow key={index} className="border-amber-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-700/50">
                  <TableCell className="text-amber-800 dark:text-slate-300">{activity.type}</TableCell>
                  <TableCell className="text-amber-800 dark:text-slate-300">{activity.item}</TableCell>
                  <TableCell className="text-amber-700 dark:text-slate-400">{activity.date}</TableCell>
                  <TableCell className="text-right text-amber-800 dark:text-slate-300">{activity.detail}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan="4" className="text-center text-amber-600 dark:text-slate-400 py-8">Нет недавней активности</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </motion.div>
  );
}