import React from 'react';
import {Navigate} from 'react-router-dom';
import {observer} from 'mobx-react-lite';
import {useStores} from '../../stores/useStores';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = observer(
  ({children, redirectTo = '/login'}) => {
    const {userStore} = useStores();

    if (!userStore.isAuthenticated) {
      return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
  },
);
