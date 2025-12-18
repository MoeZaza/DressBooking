import React from 'react'
import { usePermissions } from '../hooks/usePermissions'
import {Alert} from '@mui/material'

interface PermissionGuardProps {
  children: React.ReactNode
  action?: string
  resource?: string
  role?: string | string[]
  fallback?: React.ReactNode
  showFallback?: boolean
  requireAll?: boolean // If multiple permissions are provided, require all (default: false - require any)
}

/**
 * Component to conditionally render content based on user permissions
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  action,
  resource,
  role,
  fallback = null,
  showFallback = false,
  requireAll = false
}) => {
  const {
    hasPermission,
    isAdmin,
    isSupplier,
    isUser,
    userRole
  } = usePermissions()

  // Check role-based access
  const hasRoleAccess = (): boolean => {
    if (!role) return true

    const roles = Array.isArray(role) ? role : [role]
    
    if (requireAll) {
      return roles.every(r => checkRole(r))
    } else {
      return roles.some(r => checkRole(r))
    }
  }

  const checkRole = (roleToCheck: string): boolean => {
    switch (roleToCheck.toLowerCase()) {
      case 'admin':
        return isAdmin()
      case 'supplier':
        return isSupplier()
      case 'user':
        return isUser()
      case 'admin_or_supplier':
        return isAdmin() || isSupplier()
      default:
        return userRole === roleToCheck
    }
  }

  // Check permission-based access
  const hasPermissionAccess = (): boolean => {
    if (!action || !resource) return true
    return hasPermission(action, resource)
  }

  // Determine if user has access
  const hasAccess = hasRoleAccess() && hasPermissionAccess()

  if (hasAccess) {
    return <>{children}</>
  }

  if (showFallback && fallback) {
    return <>{fallback}</>
  }

  if (showFallback && !fallback) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        You don&apos;t have permission to access this feature.
      </Alert>
    )
  }

  return null
}

/**
 * Higher-order component version of PermissionGuard
 */
export const withPermissions = (
  Component: React.ComponentType<any>,
  permissions: Omit<PermissionGuardProps, 'children'>
) => {
  return (props: any) => (
    <PermissionGuard {...permissions}>
      <Component {...props} />
    </PermissionGuard>
  )
}

/**
 * Hook to conditionally execute functions based on permissions
 */
export const usePermissionAction = () => {
  const permissions = usePermissions()

  const executeWithPermission = (
    action: string,
    resource: string,
    callback: () => void,
    onDenied?: () => void
  ) => {
    if (permissions.hasPermission(action, resource)) {
      callback()
    } else if (onDenied) {
      onDenied()
    }
  }

  const executeWithRole = (
    role: string | string[],
    callback: () => void,
    onDenied?: () => void
  ) => {
    const roles = Array.isArray(role) ? role : [role]
    const hasRole = roles.some(r => {
      switch (r.toLowerCase()) {
        case 'admin':
          return permissions.isAdmin()
        case 'supplier':
          return permissions.isSupplier()
        case 'user':
          return permissions.isUser()
        case 'admin_or_supplier':
          return permissions.isAdminOrSupplier()
        default:
          return permissions.userRole === r
      }
    })

    if (hasRole) {
      callback()
    } else if (onDenied) {
      onDenied()
    }
  }

  return {
    executeWithPermission,
    executeWithRole,
    ...permissions
  }
}

/**
 * Component for admin/owner only content
 */
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => (
  <PermissionGuard role="admin" fallback={fallback}>
    {children}
  </PermissionGuard>
)

/**
 * Component for supplier/owner only content
 */
export const SupplierOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => (
  <PermissionGuard role="supplier" fallback={fallback}>
    {children}
  </PermissionGuard>
)

/**
 * Component for admin or supplier content
 */
export const AdminOrSupplierOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => (
  <PermissionGuard role="admin_or_supplier" fallback={fallback}>
    {children}
  </PermissionGuard>
)

/**
 * Component for specific permission-based content
 */
export const PermissionRequired: React.FC<{
  action: string
  resource: string
  children: React.ReactNode
  fallback?: React.ReactNode
}> = ({ action, resource, children, fallback }) => (
  <PermissionGuard action={action} resource={resource} fallback={fallback}>
    {children}
  </PermissionGuard>
)

export default PermissionGuard
