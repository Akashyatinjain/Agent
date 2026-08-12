import React from 'react';
import KnowledgeBase from '../features/knowledge/KnowledgeBase';

export const KnowledgePage = () => {
  return (
    <div className="h-full overflow-y-auto p-3 sm:p-6 w-full">
      <KnowledgeBase />
    </div>
  );
};

export default KnowledgePage;
