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
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
  }
  
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
    notes?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface ContactPerson {
    id: string;
    accountId: string;
    firstName: string;
    lastName: string;
    position: string;
    phone: string;
    email: string;
    isPrimary: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'admin' | 'manager' | 'account_manager' | 'sales_rep' | 'support';
    businessUnitId?: string;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Deal {
    id: string;
    title: string;
    description: string;
    amount: number;
    currency: string;
    stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
    probability: number;
    accountId: string;
    dealType: 'fuel' | 'lubricants' | 'equipment' | 'services';
    assignedTo: string;
    source: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Task {
    id: string;
    title: string;
    description: string;
    dueDate?: string;
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high';
    assignedTo: string;
    createdAt: string;
    updatedAt: string;
  }