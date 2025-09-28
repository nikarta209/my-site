import React from 'react';
import { Star } from 'lucide-react';

/**
 * Компонент для отображения частично закрашенной звезды рейтинга.
 * @param {object} props - Свойства компонента.
 * @param {number} props.rating - Рейтинг от 0 до 5.
 * @param {number} [props.size=16] - Размер иконки.
 * @param {string} [props.className] - Дополнительные классы.
 * @param {string} [props.color='text-orange-500 fill-orange-500'] - Цвет заполненной части.
 * @param {string} [props.emptyColor='text-gray-300'] - Цвет пустой части.
 */
export default function PartialStar({ rating, size = 16, className = '', color = 'text-orange-500 fill-orange-500', emptyColor = 'text-gray-300' }) {
  const fillPercentage = (rating / 5) * 100;

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      {/* Фон (пустая звезда) */}
      <Star className={`${emptyColor} absolute top-0 left-0`} size={size} />
      
      {/* Передний план (заполненная часть) */}
      <div 
        className="absolute top-0 left-0 h-full overflow-hidden" 
        style={{ width: `${fillPercentage}%` }}
      >
        <Star className={`${color} `} size={size} />
      </div>
    </div>
  );
}