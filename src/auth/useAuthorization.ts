import { useState } from 'react';
import { useAuth } from './AuthContext';
import { canAccessAdminPanel, canWriteContent, ADMIN_ONLY_MESSAGE, SIGN_IN_REQUIRED_MESSAGE } from './permissions';

// Feedback do bloqueio fica na aplicação; a regra pura permanece em permissions.ts.
export function useAuthorization() {
  const { user } = useAuth();
  const [permissionMessage, setPermissionMessage] = useState('');
  const requireWrite = () => {
    const allowed = canWriteContent(user);
    setPermissionMessage(allowed ? '' : SIGN_IN_REQUIRED_MESSAGE);
    return allowed;
  };
  const requireAdmin = () => {
    const allowed = canAccessAdminPanel(user);
    setPermissionMessage(allowed ? '' : ADMIN_ONLY_MESSAGE);
    return allowed;
  };
  return { user, requireWrite, requireAdmin, permissionMessage };
}
