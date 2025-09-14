import React, { createContext, useCallback, useContext, useState } from 'react';

interface RefreshContextType {
  refreshProfile: () => void;
  shouldRefreshProfile: boolean;
  clearRefreshFlag: () => void;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shouldRefreshProfile, setShouldRefreshProfile] = useState(false);

  const refreshProfile = useCallback(() => {
    setShouldRefreshProfile(true);
  }, []);

  const clearRefreshFlag = useCallback(() => {
    setShouldRefreshProfile(false);
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshProfile, shouldRefreshProfile, clearRefreshFlag }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};
