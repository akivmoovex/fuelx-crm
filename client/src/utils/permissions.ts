export const PERMISSIONS = {
  // User permissions
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
  
  // Customer permissions
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_WRITE: 'customers:write',
  CUSTOMERS_DELETE: 'customers:delete',
  
  // Deal permissions
  DEALS_READ: 'deals:read',
  DEALS_WRITE: 'deals:write',
  DEALS_DELETE: 'deals:delete',
  
  // Task permissions
  TASKS_READ: 'tasks:read',
  TASKS_WRITE: 'tasks:write',
  TASKS_DELETE: 'tasks:delete',
  
  // Account permissions
  ACCOUNTS_READ: 'accounts:read',
  ACCOUNTS_WRITE: 'accounts:write',
  ACCOUNTS_DELETE: 'accounts:delete',
  
  // Business Unit permissions - Original with hyphens
  BUSINESS_UNITS_READ: 'business-units:read',
  BUSINESS_UNITS_WRITE: 'business-units:write',
  BUSINESS_UNITS_DELETE: 'business-units:delete',
  
  // Tenant permissions
  TENANTS_READ: 'tenants:read',
  TENANTS_WRITE: 'tenants:write',
  TENANTS_DELETE: 'tenants:delete',
  
  // Report permissions
  REPORTS_READ: 'reports:read',
  REPORTS_WRITE: 'reports:write'
} as const; 