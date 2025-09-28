import React from 'react';
import AIAssistantChat from '../ai/AIAssistantChat';

export default function AssistantTab() {
  return (
    <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-2">Ваш ИИ-помощник</h2>
      <p className="text-muted-foreground mb-6">Задайте любой вопрос о книгах, жанрах или получите персональную рекомендацию.</p>
      <AIAssistantChat />
    </div>
  );
}