import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Lock, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

// Mock PDF pages for preview
const mockPreviewPages = [
    {
        pageNumber: 1,
        content: `ГЛАВА 1: ВВЕДЕНИЕ

Добро пожаловать в увлекательный мир этой книги. Здесь начинается наше путешествие, которое откроет перед вами новые горизонты знаний и понимания.

В этой главе мы рассмотрим основные концепции, которые станут фундаментом для дальнейшего изучения материала. Каждая страница наполнена ценной информацией, тщательно структурированной для вашего удобства.

Автор приложил максимум усилий, чтобы сделать содержание доступным и интересным для читателей всех уровней подготовки.`
    },
    {
        pageNumber: 2,
        content: `Продолжение первой главы раскрывает более глубокие аспекты темы. Здесь вы найдете детальные объяснения и практические примеры.

Каждый абзац построен таким образом, чтобы логически дополнять предыдущий материал и готовить почву для следующих разделов.

Особое внимание уделено ясности изложения и структурированности подачи информации.`
    },
    {
        pageNumber: 3,
        content: `ГЛАВА 2: ОСНОВНЫЕ ПРИНЦИПЫ

Во второй главе мы переходим к изучению ключевых принципов, которые составляют основу всей системы знаний, представленной в этой книге.

Здесь вы найдете:
• Фундаментальные концепции
• Практические рекомендации  
• Реальные примеры применения
• Упражнения для закрепления

Эта глава является мостом между теоретическими основами и практическим применением полученных знаний.`
    }
];

export default function PdfPreview({ bookId, isPurchased }) {
    const [currentPage, setCurrentPage] = useState(0);
    const [showPreview, setShowPreview] = useState(false);

    const totalPages = isPurchased ? 250 : mockPreviewPages.length; // Full book vs preview
    const availablePages = isPurchased ? mockPreviewPages.length : mockPreviewPages.length; // For demo, same

    const nextPage = () => {
        if (currentPage < availablePages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    if (!showPreview) {
        return (
            <div className="text-center py-8">
                <div className="mb-4">
                    {isPurchased ? (
                        <BookOpen className="w-16 h-16 mx-auto text-green-500 mb-4" />
                    ) : (
                        <Eye className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                    )}
                </div>
                <h3 className="text-lg font-semibold mb-2">
                    {isPurchased ? 'Читать книгу' : 'Предварительный просмотр'}
                </h3>
                <p className="text-muted-foreground mb-4">
                    {isPurchased 
                        ? 'У вас есть полный доступ к этой книге'
                        : 'Доступны первые несколько страниц для ознакомления'
                    }
                </p>
                <div className="flex items-center justify-center gap-2 mb-4">
                    {isPurchased ? (
                        <Badge className="bg-green-100 text-green-800">
                            Полный доступ • {totalPages} страниц
                        </Badge>
                    ) : (
                        <Badge variant="outline">
                            Превью • {mockPreviewPages.length} из {totalPages} страниц
                        </Badge>
                    )}
                </div>
                <Button onClick={() => setShowPreview(true)}>
                    {isPurchased ? 'Открыть книгу' : 'Показать превью'}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Preview Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                        ← Назад
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Страница {currentPage + 1} из {availablePages}
                        {!isPurchased && ` (превью)`}
                    </span>
                </div>
                {!isPurchased && (
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                        <Lock className="w-3 h-3 mr-1" />
                        Ограниченный доступ
                    </Badge>
                )}
            </div>

            {/* PDF Content */}
            <Card className="min-h-[600px]">
                <CardContent className="p-8">
                    <div className="max-w-3xl mx-auto">
                        <div className="prose prose-lg max-w-none">
                            <div className="whitespace-pre-line leading-relaxed text-gray-800 dark:text-gray-200">
                                {mockPreviewPages[currentPage]?.content || 'Содержание страницы загружается...'}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Button 
                    variant="outline" 
                    onClick={prevPage}
                    disabled={currentPage === 0}
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Предыдущая
                </Button>

                <div className="flex gap-1">
                    {mockPreviewPages.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentPage(index)}
                            className={`w-3 h-3 rounded-full transition-colors ${
                                index === currentPage 
                                    ? 'bg-blue-500' 
                                    : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                        />
                    ))}
                    {!isPurchased && (
                        <div className="flex items-center ml-2">
                            <Lock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400 ml-1">
                                +{totalPages - availablePages} страниц
                            </span>
                        </div>
                    )}
                </div>

                <Button 
                    variant="outline" 
                    onClick={nextPage}
                    disabled={currentPage >= availablePages - 1}
                >
                    Следующая
                    <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>

            {/* Purchase Prompt for Preview Users */}
            {!isPurchased && currentPage === availablePages - 1 && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <CardContent className="p-6 text-center">
                        <h4 className="font-semibold mb-2">Хотите читать дальше?</h4>
                        <p className="text-muted-foreground mb-4">
                            Получите полный доступ ко всем {totalPages} страницам этой книги
                        </p>
                        <Button className="bg-[#4CAF50] hover:bg-[#388E3C]">
                            Купить полную версию
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}