// Role-based permissions configuration for the frontend
export enum UserRole {
  ADMIN = 'admin',
  SUPPLIER = 'supplier', 
  USER = 'user'
}

export interface Permission {
  action: string
  resource: string
  description: string
  roles: UserRole[]
}

// Define all permissions in the system
export const PERMISSIONS: Permission[] = [
  // Booking Management
  {
    action: 'create',
    resource: 'booking',
    description: 'Add new bookings',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },
  {
    action: 'update',
    resource: 'booking',
    description: 'Update booking details',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },
  {
    action: 'delete',
    resource: 'booking',
    description: 'Delete bookings',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },
  {
    action: 'view',
    resource: 'booking',
    description: 'View booking details',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER, UserRole.USER]
  },

  // Fitting Appointments
  {
    action: 'create',
    resource: 'fitting_appointment',
    description: 'Schedule fitting appointments',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },
  {
    action: 'update',
    resource: 'fitting_appointment',
    description: 'Update appointment status and notes',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },
  {
    action: 'view',
    resource: 'fitting_appointment',
    description: 'View fitting appointments',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER, UserRole.USER]
  },

  // Payment Management
  {
    action: 'create',
    resource: 'payment',
    description: 'Add full/partial payments',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },
  {
    action: 'update',
    resource: 'payment',
    description: 'Update payment status',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },
  {
    action: 'refund',
    resource: 'payment',
    description: 'Process refunds',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },
  {
    action: 'view',
    resource: 'payment',
    description: 'View payment details',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER, UserRole.USER]
  },

  // Expense Management
  {
    action: 'create',
    resource: 'expense',
    description: 'Add business expenses',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },
  {
    action: 'view',
    resource: 'expense',
    description: 'View expenses',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },
  {
    action: 'update',
    resource: 'expense',
    description: 'Edit expenses',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },

  // Dress Code Management (Owner-only)
  {
    action: 'edit',
    resource: 'dress_code',
    description: 'Edit dress codes (owner-only)',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },
  {
    action: 'view',
    resource: 'dress_code',
    description: 'View dress codes (owner-only)',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },

  // Accounting Views
  {
    action: 'view',
    resource: 'accounting',
    description: 'Access accounting views and calculations',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },
  {
    action: 'view',
    resource: 'financial_reports',
    description: 'View financial reports and analytics',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },
  {
    action: 'view',
    resource: 'monthly_revenue',
    description: 'View monthly revenue data',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },

  // Analytics and Reports
  {
    action: 'view',
    resource: 'analytics',
    description: 'View booking and cancellation analytics',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },
  {
    action: 'view',
    resource: 'inventory_stats',
    description: 'View inventory management statistics',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },

  // Wedding Packages
  {
    action: 'create',
    resource: 'wedding_package',
    description: 'Create wedding packages',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },
  {
    action: 'update',
    resource: 'wedding_package',
    description: 'Update wedding packages',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },
  {
    action: 'delete',
    resource: 'wedding_package',
    description: 'Delete wedding packages',
    roles: [UserRole.ADMIN, UserRole.SUPPLIER]
  },

  // User Management
  {
    action: 'manage',
    resource: 'users',
    description: 'Manage user accounts',
    roles: [UserRole.ADMIN]
  },

  // System Settings
  {
    action: 'manage',
    resource: 'settings',
    description: 'Manage system settings',
    roles: [UserRole.ADMIN]
  }
]

// Helper functions for permission checking
export class PermissionChecker {
  private userRole: UserRole

  constructor(userRole: string) {
    this.userRole = userRole as UserRole
  }

  /**
   * Check if user has permission for a specific action on a resource
   */
  hasPermission(action: string, resource: string): boolean {
    const permission = PERMISSIONS.find(p => p.action === action && p.resource === resource)
    return permission ? permission.roles.includes(this.userRole) : false
  }

  /**
   * Check if user has any permission for a resource
   */
  hasAnyPermission(resource: string): boolean {
    return PERMISSIONS.some(p => p.resource === resource && p.roles.includes(this.userRole))
  }

  /**
   * Get all permissions for the current user
   */
  getUserPermissions(): Permission[] {
    return PERMISSIONS.filter(p => p.roles.includes(this.userRole))
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.userRole === UserRole.ADMIN
  }

  /**
   * Check if user is supplier/owner
   */
  isSupplier(): boolean {
    return this.userRole === UserRole.SUPPLIER
  }

  /**
   * Check if user is regular user
   */
  isUser(): boolean {
    return this.userRole === UserRole.USER
  }

  /**
   * Check if user has admin or supplier privileges
   */
  isAdminOrSupplier(): boolean {
    return this.isAdmin() || this.isSupplier()
  }
}

// Permission constants for easy reference
export const PERMISSION_ACTIONS = {
  CREATE: 'create',
  READ: 'view',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  EDIT: 'edit',
  REFUND: 'refund'
} as const

export const PERMISSION_RESOURCES = {
  BOOKING: 'booking',
  FITTING_APPOINTMENT: 'fitting_appointment',
  PAYMENT: 'payment',
  EXPENSE: 'expense',
  DRESS_CODE: 'dress_code',
  ACCOUNTING: 'accounting',
  FINANCIAL_REPORTS: 'financial_reports',
  MONTHLY_REVENUE: 'monthly_revenue',
  ANALYTICS: 'analytics',
  INVENTORY_STATS: 'inventory_stats',
  WEDDING_PACKAGE: 'wedding_package',
  USERS: 'users',
  SETTINGS: 'settings'
} as const

export default {
  PERMISSIONS,
  PermissionChecker,
  UserRole,
  PERMISSION_ACTIONS,
  PERMISSION_RESOURCES
}
