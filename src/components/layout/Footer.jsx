import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Github, 
  Twitter, 
  Mail, 
  Heart, 
  Zap,
  Smartphone,
  Globe
} from 'lucide-react';
import { useTheme } from './ThemeProvider';

// Простой SVG QR код (статичный) вместо qrcode.js
const SimpleQRCode = ({ value, size = 60 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="bg-white rounded"
      style={{ padding: '3px' }}
    >
      {/* Упрощенная имитация QR кода */}
      <rect x="10" y="10" width="20" height="20" fill="#1A1A2E" />
      <rect x="70" y="10" width="20" height="20" fill="#1A1A2E" />
      <rect x="10" y="70" width="20" height="20" fill="#1A1A2E" />
      
      <rect x="15" y="15" width="10" height="10" fill="white" />
      <rect x="75" y="15" width="10" height="10" fill="white" />
      <rect x="15" y="75" width="10" height="10" fill="white" />
      
      {/* Центральная часть */}
      <rect x="45" y="40" width="10" height="20" fill="#1A1A2E" />
      <rect x="40" y="45" width="20" height="10" fill="#1A1A2E" />
      
      {/* Случайные точки для имитации данных */}
      <rect x="35" y="25" width="5" height="5" fill="#1A1A2E" />
      <rect x="55" y="25" width="5" height="5" fill="#1A1A2E" />
      <rect x="25" y="35" width="5" height="5" fill="#1A1A2E" />
      <rect x="65" y="35" width="5" height="5" fill="#1A1A2E" />
      <rect x="35" y="65" width="5" height="5" fill="#1A1A2E" />
      <rect x="55" y="65" width="5" height="5" fill="#1A1A2E" />
      
      <text x="50" y="95" textAnchor="middle" fontSize="5" fill="#666">
        KASBOOK
      </text>
    </svg>
  );
};

export default function Footer() {
  const { isMobile } = useTheme();
  const currentYear = new Date().getFullYear();
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kasbook.io';

  // Hide footer on mobile (bottom nav takes its place)
  if (isMobile) {
    return null;
  }

  const footerSections = [
    {
      title: 'Платформа',
      links: [
        { name: 'Каталог', href: createPageUrl('Catalog') },
        { name: 'Авторам', href: createPageUrl('RegisterAuthor') },
        { name: 'О проекте', href: createPageUrl('Home') },
        { name: 'API', href: '#' },
      ]
    },
    {
      title: 'Поддержка',
      links: [
        { name: 'Помощь', href: '#' },
        { name: 'Контакты', href: 'mailto:support@kasbook.io' },
        { name: 'FAQ', href: '#' },
        { name: 'Статус системы', href: '#' },
      ]
    },
    {
      title: 'Правовая информация',
      links: [
        { name: 'Политика конфиденциальности', href: '#' },
        { name: 'Условия использования', href: '#' },
        { name: 'Лицензия', href: '#' },
        { name: 'GDPR', href: '#' },
      ]
    }
  ];

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/kasbook', color: '#1DA1F2', label: 'Twitter' },
    { icon: Github, href: 'https://github.com/kasbook', color: '#333', label: 'GitHub' },
    { icon: Mail, href: 'mailto:support@kasbook.io', color: '#EA4335', label: 'Email' },
    { icon: Globe, href: 'https://kasbook.io', color: '#6A4C93', label: 'Website' }
  ];

  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-t border-slate-700 mt-12"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Logo and description - компактная версия */}
          <div className="lg:col-span-2">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 mb-3"
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #6A4C93 0%, #FF6B00 100%)'
                }}
              >
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold">KASBOOK</span>
            </motion.div>
            
            <p className="text-slate-300 text-xs leading-relaxed mb-3 max-w-md">
              Современная платформа для покупки и продажи электронных книг 
              на блокчейне Kaspa. Поддерживаем авторов, развиваем чтение.
            </p>

            {/* QR Code - уменьшенный */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium">Мобильное приложение</span>
              </div>
              <div className="inline-block">
                <SimpleQRCode value={appUrl} size={60} />
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-[60px]">
                Сканируйте для доступа
              </p>
            </div>

            {/* Social Links - уменьшенные */}
            <div className="flex gap-2">
              {socialLinks.map(({ icon: Icon, href, color, label }) => (
                <motion.a
                  key={label}
                  whileHover={{ scale: 1.1, y: -1 }}
                  whileTap={{ scale: 0.9 }}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 hover:shadow-lg"
                  style={{ backgroundColor: color }}
                  aria-label={label}
                >
                  <Icon className="w-3 h-3 text-white" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Footer Sections - компактные */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <motion.div 
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.2 }}
                    >
                      {link.href.startsWith('http') || link.href.startsWith('mailto') ? (
                        <a
                          href={link.href}
                          target={link.href.startsWith('http') ? '_blank' : undefined}
                          rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="text-slate-300 hover:text-white transition-colors text-xs py-1 block hover:underline"
                        >
                          {link.name}
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="text-slate-300 hover:text-white transition-colors text-xs py-1 block hover:underline"
                        >
                          {link.name}
                        </Link>
                      )}
                    </motion.div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider - компактная */}
        <div className="border-t border-slate-700 mt-6 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="text-xs text-slate-400">
              © {currentYear} KASBOOK. Все права защищены.
            </div>
            
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Сделано с</span>
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatDelay: 3,
                  ease: "easeInOut" 
                }}
                className="motion-reduce:animate-none"
              >
                <Heart className="w-3 h-3 text-red-500 fill-current" />
              </motion.div>
              <span>на</span>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-1 font-medium text-orange-500"
              >
                <Zap className="w-3 h-3" />
                <span>Base44</span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}