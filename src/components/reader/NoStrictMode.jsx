import React from 'react';

// Этот компонент-обертка нужен для того, чтобы отключить React.StrictMode
// для дочерних компонентов. Это временное решение, необходимое для
// корректной работы библиотеки react-pdf, которая имеет проблемы
// с двойным рендерингом в режиме разработки React 18.
export default function NoStrictMode({ children }) {
  return <>{children}</>;
}