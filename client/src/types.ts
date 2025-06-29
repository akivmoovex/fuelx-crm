export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  businessUnitId?: string;
  status: string;
  businessUnit?: {
    name: string;
    location: string;
  };
  tenant?: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  type: string;
  status: string;
  description?: string;
  users?: number;
  businessUnits?: number;
  accounts?: number;
} 