import React from 'react';
import {rootStore} from './index';

const StoreContext = React.createContext(rootStore);

export const useStores = () => {
  return React.useContext(StoreContext);
};

export const StoreProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  return (
    <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>
  );
};
