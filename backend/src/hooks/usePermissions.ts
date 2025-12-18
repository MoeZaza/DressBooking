import { useMemo } from 'react'
import { useUserContext, UserContextType } from '../context/UserContext'
import { PermissionChecker, UserRole, PERMISSION_ACTIONS, PERMISSION_RESOURCES } from '../config/permissions'

/**
 * Custom hook for checking user permissions
 */
export const usePermissions = () => {
  const { user } = useUserContext() as UserContextType
  
  const permissionChecker = useMemo(() => {
    if (!user?.type) return null
    return new PermissionChecker(user.type)
  }, [user?.type])

  const hasPermission = (action: string, resource: string): boolean => {
    return permissionChecker?.hasPermission(action, resource) ?? false
  }

  const hasAnyPermission = (resource: string): boolean => {
    return permissionChecker?.hasAnyPermission(resource) ?? false
  }

  const isAdmin = (): boolean => {
    return permissionChecker?.isAdmin() ?? false
  }

  const isSupplier = (): boolean => {
    return permissionChecker?.isSupplier() ?? false
  }

  const isUser = (): boolean => {
    return permissionChecker?.isUser() ?? false
  }

  const isAdminOrSupplier = (): boolean => {
    return permissionChecker?.isAdminOrSupplier() ?? false
  }

  // Specific permission checks for common operations
  const canManageBookings = (): boolean => {
    return hasPermission(PERMISSION_ACTIONS.CREATE, PERMISSION_RESOURCES.BOOKING)
  }

  const canManageFittingAppointments = (): boolean => {
    return hasPermission(PERMISSION_ACTIONS.CREATE, PERMISSION_RESOURCES.FITTING_APPOINTMENT)
  }

  const canManagePayments = (): boolean => {
    return hasPermission(PERMISSION_ACTIONS.CREATE, PERMISSION_RESOURCES.PAYMENT)
  }

  const canManageExpenses = (): boolean => {
    return hasPermission(PERMISSION_ACTIONS.CREATE, PERMISSION_RESOURCES.EXPENSE)
  }

  const canEditDressCodes = (): boolean => {
    return hasPermission(PERMISSION_ACTIONS.EDIT, PERMISSION_RESOURCES.DRESS_CODE)
  }

  const canViewAccounting = (): boolean => {
    return hasPermission(PERMISSION_ACTIONS.READ, PERMISSION_RESOURCES.ACCOUNTING)
  }

  const canViewAnalytics = (): boolean => {
    return hasPermission(PERMISSION_ACTIONS.READ, PERMISSION_RESOURCES.ANALYTICS)
  }

  const canManageWeddingPackages = (): boolean => {
    return hasPermission(PERMISSION_ACTIONS.CREATE, PERMISSION_RESOURCES.WEDDING_PACKAGE)
  }

  const canProcessRefunds = (): boolean => {
    return hasPermission(PERMISSION_ACTIONS.REFUND, PERMISSION_RESOURCES.PAYMENT)
  }

  return {
    // Core permission checking
    hasPermission,
    hasAnyPermission,
    
    // Role checking
    isAdmin,
    isSupplier,
    isUser,
    isAdminOrSupplier,
    
    // Specific permission checks
    canManageBookings,
    canManageFittingAppointments,
    canManagePayments,
    canManageExpenses,
    canEditDressCodes,
    canViewAccounting,
    canViewAnalytics,
    canManageWeddingPackages,
    canProcessRefunds,
    
    // User info
    userRole: user?.type as UserRole,
    userId: user?._id,
    
    // Permission checker instance
    permissionChecker
  }
}

export default usePermissions
