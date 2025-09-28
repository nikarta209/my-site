
import React from 'react';
import { 
    BookOpen, ShoppingCart, User, ChevronDown, LogOut, Search, Library, Edit, Shield, Heart, MessageSquare, Sun, Moon, BookText,
    BarChart, DollarSign, Book, Users, Star, TrendingUp, Info, PlusCircle
} from 'lucide-react';

// Mock data based on the prompt
const metrics = [
    { title: 'Общая доход', value: '0.00 KAS', subValue: '$0.00', change: '+1.5%', changeType: 'positive' },
    { title: 'Продажи', value: '0', subValue: 'за неделю', change: '-8.2%', changeType: 'negative' },
    { title: 'Книги', value: '1', subValue: 'avg. rating 0.0+', change: '', changeType: '' },
    { title: 'Пайки', value: '0', subValue: '', change: '', changeType: '' },
    { title: 'Люди', value: '0', subValue: 'читатели', change: '-15.3%', changeType: 'negative' },
];

const bookStats = [
    { icon: <BookText size={24} className="text-purple-500" />, title: 'self-help', sales: 0, income: '0.00 KAS', likes: 0, rating: 0.0 },
];

const myBooksData = [
    { title: 'Без названия Self-Help', status: 'На модерации', likes: 0, price: '100 KAS' },
];

// Mock Chart Components
const SalesLineChart = () => (
    <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
        <svg width="100%" height="100%" viewBox="0 0 400 200" className="bg-gray-50 rounded-lg">
            <text x="160" y="100" fill="currentColor">Динамика продаж</text>
            <path d="M 20 180 L 380 180" stroke="#E5E7EB" strokeWidth="2" />
        </svg>
    </div>
);

const IncomeBarChart = () => (
    <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
        <svg width="100%" height="100%" viewBox="0 0 400 200" className="bg-gray-50 rounded-lg">
             <text x="160" y="100" fill="currentColor">Доходы по дням</text>
             <path d="M 20 180 L 380 180" stroke="#E5E7EB" strokeWidth="2" />
        </svg>
    </div>
);


const Header = () => (
    <header className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <BookOpen className="text-cyan-600" size={28} />
            <h1 className="text-xl font-bold text-gray-800">KASBOOK</h1>
            <nav className="flex items-center gap-6 ml-6 text-sm font-medium text-gray-500">
                <a href="#" className="hover:text-cyan-600">Каталог</a>
                <a href="#" className="hover:text-cyan-600">Библиотека</a>
                <a href="#" className="text-cyan-600 font-semibold border-b-2 border-cyan-600 pb-1">Панель автора</a>
            </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-700 font-mono text-xs bg-gray-100 px-2 py-1 rounded">Balance: $0.065401</span>
            <ShoppingCart className="text-gray-600 cursor-pointer" size={20} />
            <div className="flex items-center gap-2 cursor-pointer">
                <User className="text-gray-600" size={20} />
                <span className="text-gray-800 font-medium">Artem Antipin</span>
                <LogOut className="text-gray-400" size={16} />
            </div>
        </div>
    </header>
);

const TabContent = ({ activeTab }) => {
    if (activeTab === 'Обзор') {
        return (
            <div className="space-y-6">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {metrics.map(metric => (
                        <div key={metric.title} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-500">{metric.title}</h3>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{metric.value}</p>
                            <div className="flex items-center justify-between text-xs mt-2">
                                <span className="text-gray-400">{metric.subValue}</span>
                                {metric.change && (
                                    <span className={metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}>
                                        {metric.change}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Royalty & Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                         <h3 className="font-semibold text-gray-700">Рейтинг уровень: Beginner</h3>
                         <p className="text-xs text-gray-500 mt-1">80% до уровня 'Starter'</p>
                         <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                             <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: '80%' }}></div>
                         </div>
                         <div className="mt-4 space-y-2">
                             <div className="flex items-center gap-2 p-2 bg-orange-50 text-orange-700 rounded-md text-xs"><Star size={14}/><span>Бронза: 51+ продаж</span></div>
                             <div className="flex items-center gap-2 p-2 bg-gray-100 text-gray-600 rounded-md text-xs"><Star size={14}/><span>Серебро: 101+ продаж</span></div>
                         </div>
                    </div>
                    <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                               <h3 className="font-semibold text-gray-700 mb-2">Динамика продаж</h3>
                               <SalesLineChart />
                            </div>
                            <div>
                               <h3 className="font-semibold text-gray-700 mb-2">Доходы по дням</h3>
                               <IncomeBarChart />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Genre & Book Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="font-semibold text-gray-700 mb-3">Продажи по жанрам</h3>
                        <div className="flex flex-wrap gap-2">
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">self-help</span>
                        </div>
                    </div>
                    <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="font-semibold text-gray-700 mb-3">Статистика по книгам</h3>
                        <table className="w-full text-sm text-left text-gray-600">
                           <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-4 py-2">Книга</th>
                                    <th scope="col" className="px-4 py-2">Продажи</th>
                                    <th scope="col" className="px-4 py-2">Доход</th>
                                    <th scope="col" className="px-4 py-2">Лайки</th>
                                    <th scope="col" className="px-4 py-2">Рейтинг</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookStats.map(book => (
                                    <tr key={book.title} className="bg-white border-b">
                                        <td className="px-4 py-2 font-medium text-gray-900 flex items-center gap-2">{book.icon} {book.title}</td>
                                        <td className="px-4 py-2">{book.sales}</td>
                                        <td className="px-4 py-2">{book.income}</td>
                                        <td className="px-4 py-2">{book.likes}</td>
                                        <td className="px-4 py-2 flex items-center gap-1">{book.rating} <Star size={12} className="text-yellow-400"/></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
    if (activeTab === 'Мои книги') {
         return (
             <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                 <table className="w-full text-sm text-left text-gray-600">
                           <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Книга</th>
                                    <th scope="col" className="px-6 py-3">Статус</th>
                                    <th scope="col" className="px-6 py-3">Статистика</th>
                                    <th scope="col" className="px-6 py-3">Цена</th>
                                    <th scope="col" className="px-6 py-3">Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myBooksData.map(book => (
                                    <tr key={book.title} className="bg-white border-b">
                                        <td className="px-6 py-4 font-medium text-gray-900">{book.title}</td>
                                        <td className="px-6 py-4"><span className="bg-yellow-100 text-yellow-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">{book.status}</span></td>
                                        <td className="px-6 py-4">Лайки: {book.likes}</td>
                                        <td className="px-6 py-4">{book.price}</td>
                                        <td className="px-6 py-4"><button className="font-medium text-cyan-600 hover:underline">Редактировать</button></td>
                                    </tr>
                                ))}
                            </tbody>
                 </table>
             </div>
         );
    }
     if (activeTab === 'Отзывы') {
        return (
            <div className="text-center p-12 bg-white rounded-lg border border-gray-200 shadow-sm">
                <Heart size={48} className="mx-auto text-gray-300" />
                <p className="mt-4 text-sm text-gray-500">Здесь будут отображаться отзывы на книги автора nikarta2003@gmail.com.</p>
            </div>
        )
    }
    if (activeTab === 'Заметки') {
        return (
            <div className="text-center p-12 bg-white rounded-lg border border-gray-200 shadow-sm">
                <MessageSquare size={48} className="mx-auto text-gray-300" />
                <p className="mt-4 text-sm text-gray-500">Здесь показаны цитаты и заметки, которыми поделились читатели ваших книг.</p>
            </div>
        )
    }
    return null;
}


export default function AuthorPanelRedesign() {
    const [activeTab, setActiveTab] = React.useState('Обзор');
    const tabs = ['Обзор', 'Аналитика', 'Мои книги', 'Отзывы', 'Заметки', 'Загрузка'];

    return (
        <div className="bg-[#F7FAFC] min-h-screen font-sans">
            <Header />
            <main className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Title */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Панель автора</h2>
                        <p className="text-gray-500">Добро пожаловать, Artem Antipin! Управляйте своими книгами и отслеживайте статистику.</p>
                    </div>

                    {/* Tabs */}
                    <div className="mb-6">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                                {tabs.map(tab => (
                                    <button 
                                        key={tab} 
                                        onClick={() => setActiveTab(tab)}
                                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                                            ${activeTab === tab 
                                                ? 'border-cyan-500 text-cyan-600 bg-cyan-50/50' 
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                                        }
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>
                    
                    {/* Tab Content */}
                    <div>
                        <TabContent activeTab={activeTab} />
                    </div>
                </div>
            </main>
        </div>
    );
}
