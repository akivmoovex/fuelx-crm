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

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  // Add more fields as needed
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

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
  customerId: string;
  assignedTo?: string;
  source?: string;
  notes?: string;
  dealType: 'fuel' | 'insurance';
  litresPerMonth?: number;
  insuranceType?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    company: string;
    email?: string;
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
  customerId: string;
  assignedTo: string;
  source: string;
  notes: string;
  dealType: 'fuel' | 'insurance';
  litresPerMonth: string;
  insuranceType: string;
}
