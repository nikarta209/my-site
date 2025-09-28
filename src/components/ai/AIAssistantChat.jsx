import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot } from 'lucide-react';

const mockResponses = {
  "default": "Я ваш ИИ-помощник по книгам. Спросите меня о жанре, авторе или порекомендуйте что-нибудь!",
  "genre": "Отличный выбор! В жанре 'фэнтези' у нас есть 'Хроники Ветра' и 'Тень Дракона'. Что вас больше интересует?",
  "author": "Джон Смит - прекрасный автор. Его самая популярная книга у нас - 'Последний Горизонт'. Хотите узнать больше?",
  "greeting": "Здравствуйте! Чем могу помочь вам сегодня в мире книг?"
};

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center space-x-1 p-3 rounded-2xl bg-muted w-fit"
  >
    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
  </motion.div>
);

export default function AIAssistantChat() {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: mockResponses.default }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    const newUserMessage = { sender: 'user', text: inputValue };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      let responseText = mockResponses.default;
      const lowerCaseInput = inputValue.toLowerCase();
      if (lowerCaseInput.includes('фэнтези') || lowerCaseInput.includes('genre')) {
        responseText = mockResponses.genre;
      } else if (lowerCaseInput.includes('смит') || lowerCaseInput.includes('author')) {
        responseText = mockResponses.author;
      } else if (lowerCaseInput.includes('привет') || lowerCaseInput.includes('здравствуйте')) {
          responseText = mockResponses.greeting;
      }
      
      const newAiMessage = { sender: 'ai', text: responseText };
      setIsTyping(false);
      setMessages(prev => [...prev, newAiMessage]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20} /></AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-xs md:max-w-md p-3 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted text-muted-foreground rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && <TypingIndicator />}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Спросите что-нибудь..."
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={isTyping}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}