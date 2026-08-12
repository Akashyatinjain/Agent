import React from 'react';
import SettingsPanel from '../features/settings/SettingsPanel';

export const SettingsPage = () => {
  return (
    <div className="h-full overflow-y-auto p-3 sm:p-6 w-full">
      <SettingsPanel />
    </div>
  );
};

export default SettingsPage;
