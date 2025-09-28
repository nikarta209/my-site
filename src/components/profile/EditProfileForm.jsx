import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useAuth } from '../auth/Auth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function EditProfileForm({ user, onUpdate, onCancel }) {
  const { updateUser } = useAuth();
  const form = useForm({
    defaultValues: {
      full_name: user.full_name || '',
      bio: user.bio || '',
    },
  });

  const onSubmit = async (data) => {
    // Ручная валидация
    if (!data.full_name || data.full_name.length < 2) {
      toast.error('Имя должно содержать не менее 2 символов.');
      return;
    }
    if (data.bio && data.bio.length > 300) {
      toast.error('Биография не может превышать 300 символов.');
      return;
    }

    try {
      await updateUser(data);
      toast.success('Профиль успешно обновлен!');
      onUpdate();
    } catch (error) {
      toast.error('Не удалось обновить профиль. Попробуйте снова.');
      console.error(error);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 className="text-xl font-semibold mb-6 text-slate-200">Редактирование профиля</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Полное имя</FormLabel>
                <FormControl>
                  <Input className="dark:bg-slate-800 dark:border-slate-700" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Биография</FormLabel>
                <FormControl>
                  <Textarea
                    className="dark:bg-slate-800 dark:border-slate-700 min-h-[100px]"
                    placeholder="Расскажите немного о себе..."
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="dark:border-slate-700 hover:dark:bg-slate-800">
              Отмена
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
              Сохранить изменения
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}