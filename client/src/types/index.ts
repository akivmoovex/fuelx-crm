// Business Unit Types
export interface BusinessUnit {
  id: string;
  name: string;
  location: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  managerId: string;
  tenantId: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tenant?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface BusinessUnitFormData {
  name: string;
  location: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  managerId: string;
  tenantId: string;
  status: 'active' | 'inactive';
}

// Account Types (replaces Customer)
export interface Account {
  id: string;
  name: string;
  type: 'company' | 'individual';
  registrationNumber?: string;
  taxNumber?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  status: 'active' | 'inactive' | 'suspended';
  businessUnitId: string;
  accountManagerId: string;
  creditLimit: number;
  paymentTerms: string;
  industry: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  businessUnit?: {
    id: string;
    name: string;
    location: string;
  };
  accountManager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AccountFormData {
  name: string;
  type: 'company' | 'individual';
  registrationNumber: string;
  taxNumber: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  status: 'active' | 'inactive' | 'suspended';
  businessUnitId: string;
  accountManagerId: string;
  creditLimit: string;
  paymentTerms: string;
  industry: string;
  notes: string;
}

// Contact Person Types
export interface ContactPerson {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  isPrimary: boolean;
  canPlaceOrders: boolean;
  canViewReports: boolean;
  canViewInvoices: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  account?: {
    id: string;
    name: string;
    type: 'company' | 'individual';
  };
}

export interface ContactPersonFormData {
  accountId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  isPrimary: boolean;
  canPlaceOrders: boolean;
  canViewReports: boolean;
  canViewInvoices: boolean;
  status: 'active' | 'inactive';
}

// User Types (updated)
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'account_manager' | 'sales_rep' | 'support';
  status: 'active' | 'inactive';
  businessUnitId?: string;
  department: string;
  position: string;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
  businessUnit?: {
    id: string;
    name: string;
    location: string;
  };
}

// Task Types (updated)
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string;
  accountId?: string;
  businessUnitId?: string;
  type: 'follow_up' | 'meeting' | 'proposal' | 'maintenance' | 'other';
  createdAt: string;
  updatedAt: string;
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  account?: {
    id: string;
    name: string;
    type: 'company' | 'individual';
  };
}

// Deal Types (updated)
export interface Deal {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  accountId: string;
  assignedTo?: string;
  businessUnitId?: string;
  source?: string;
  notes?: string;
  dealType: 'fuel' | 'lubricants' | 'equipment' | 'services';
  litresPerMonth?: number;
  fuelType?: string;
  createdAt: string;
  updatedAt: string;
  account?: {
    id: string;
    name: string;
    type: 'company' | 'individual';
  };
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface DealFormData {
  title: string;
  description: string;
  amount: string;
  currency: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: string;
  expectedCloseDate: string;
  actualCloseDate: string;
  accountId: string;
  assignedTo: string;
  businessUnitId: string;
  source: string;
  notes: string;
  dealType: 'fuel' | 'lubricants' | 'equipment' | 'services';
  litresPerMonth: string;
  fuelType: string;
}

// Legacy Customer types (for backward compatibility)
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  source: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  source: string;
  notes: string;
}
 