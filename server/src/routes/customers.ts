import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requirePermission, requireTenantAccess } from '../middleware/auth';
import { PERMISSIONS } from '../utils/permissions';

const router = express.Router();
const prisma = new PrismaClient();

// GET all customers (tenant-filtered, but SYSTEM_ADMIN sees all)
router.get('/', authenticateToken, requirePermission(PERMISSIONS.CUSTOMERS_READ), async (req, res) => {
  try {
    const { status, search } = req.query;
    const where: any = {};
    
    // SYSTEM_ADMIN can see all customers, others are filtered by tenant
    if (req.user.role !== 'SYSTEM_ADMIN') {
      where.tenantId = req.user.tenantId;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    const customers = await prisma.customer.findMany({ 
      where,
      include: {
        tenant: {
          select: { name: true }
        }
      }
    });
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET single customer
router.get('/:id', authenticateToken, requirePermission(PERMISSIONS.CUSTOMERS_READ), requireTenantAccess('customer'), async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        tenant: {
          select: { name: true }
        }
      }
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST new customer
router.post('/', authenticateToken, requirePermission(PERMISSIONS.CUSTOMERS_WRITE), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      status = 'lead',
      source,
      notes
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: firstName, lastName, email' 
      });
    }

    // Check if customer with same email already exists in the same tenant
    const existingCustomer = await prisma.customer.findFirst({
      where: { 
        email: email.toLowerCase(),
        tenantId: req.user.tenantId
      }
    });
    
    if (existingCustomer) {
      return res.status(400).json({ error: 'Customer with this email already exists' });
    }

    const customer = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone: phone || '',
        company: company || '',
        status,
        source: source || '',
        notes: notes || '',
        tenantId: req.user.tenantId // Automatically assign to user's tenant
      },
      include: {
        tenant: {
          select: { name: true }
        }
      }
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// PUT update customer
router.put('/:id', authenticateToken, requirePermission(PERMISSIONS.CUSTOMERS_WRITE), requireTenantAccess('customer'), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      status,
      source,
      notes
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: firstName, lastName, email' 
      });
    }

    // Check if customer with same email already exists in the same tenant (excluding current customer)
    const existingCustomer = await prisma.customer.findFirst({
      where: { 
        email: email.toLowerCase(),
        tenantId: req.user.tenantId,
        id: { not: req.params.id }
      }
    });
    
    if (existingCustomer) {
      return res.status(400).json({ error: 'Customer with this email already exists' });
    }

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone: phone || '',
        company: company || '',
        status: status || 'lead',
        source: source || '',
        notes: notes || ''
      },
      include: {
        tenant: {
          select: { name: true }
        }
      }
    });

    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE customer
router.delete('/:id', authenticateToken, requirePermission(PERMISSIONS.CUSTOMERS_DELETE), requireTenantAccess('customer'), async (req, res) => {
  try {
    // Check if customer has associated deals
    const hasDeals = await prisma.deal.findFirst({
      where: { customerId: req.params.id }
    });
    
    if (hasDeals) {
      return res.status(400).json({ 
        error: 'Cannot delete customer that has associated deals' 
      });
    }

    await prisma.customer.delete({
      where: { id: req.params.id }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;