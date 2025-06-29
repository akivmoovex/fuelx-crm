import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET all tenants
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            businessUnits: true,
            accounts: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Transform the data to include counts
    const transformedTenants = tenants.map(tenant => ({
      ...tenant,
      users: tenant._count.users,
      businessUnits: tenant._count.businessUnits,
      accounts: tenant._count.accounts
    }));

    console.log('Fetched tenants:', transformedTenants);
    res.json(transformedTenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// GET single tenant
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            users: true,
            businessUnits: true,
            accounts: true
          }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const transformedTenant = {
      ...tenant,
      users: tenant._count.users,
      businessUnits: tenant._count.businessUnits,
      accounts: tenant._count.accounts
    };

    res.json(transformedTenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

// POST new tenant (SYSTEM_ADMIN only)
router.post('/', authenticateToken, requirePermission('tenants:write'), async (req, res) => {
  try {
    const { name, type, status, notes } = req.body;

    console.log('Creating tenant with data:', { name, type, status, notes });

    // Validate required fields
    if (!name || !type || !status) {
      return res.status(400).json({ error: 'Name, type, and status are required' });
    }

    // Validate tenant type
    if (!['HQ', 'SALES_OFFICE'].includes(type)) {
      return res.status(400).json({ error: 'Invalid tenant type. Must be HQ or SALES_OFFICE' });
    }

    // Check if tenant name already exists
    const existingTenant = await prisma.tenant.findFirst({
      where: { name: name.trim() }
    });

    if (existingTenant) {
      return res.status(400).json({ error: 'Tenant name must be unique' });
    }

    // Create the tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: name.trim(),
        type,
        status,
        notes: notes?.trim() || null
      }
    });

    console.log('Tenant created successfully:', tenant);

    // Return the created tenant with counts
    const tenantWithCounts = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      include: {
        _count: {
          select: {
            users: true,
            businessUnits: true,
            accounts: true
          }
        }
      }
    });

    const transformedTenant = {
      ...tenantWithCounts,
      users: tenantWithCounts?._count.users || 0,
      businessUnits: tenantWithCounts?._count.businessUnits || 0,
      accounts: tenantWithCounts?._count.accounts || 0
    };

    res.status(201).json(transformedTenant);
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// PUT update tenant (SYSTEM_ADMIN only)
router.put('/:id', authenticateToken, requirePermission('tenants:write'), async (req, res) => {
  try {
    const { name, type, status, notes } = req.body;
    const tenantId = req.params.id;

    console.log('Updating tenant:', tenantId, { name, type, status, notes });

    // Validate required fields
    if (!name || !type || !status) {
      return res.status(400).json({ error: 'Name, type, and status are required' });
    }

    // Validate tenant type
    if (!['HQ', 'SALES_OFFICE'].includes(type)) {
      return res.status(400).json({ error: 'Invalid tenant type. Must be HQ or SALES_OFFICE' });
    }

    // Check if tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!existingTenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check if new name conflicts with another tenant
    const nameConflict = await prisma.tenant.findFirst({
      where: {
        name: name.trim(),
        id: { not: tenantId }
      }
    });

    if (nameConflict) {
      return res.status(400).json({ error: 'Tenant name must be unique' });
    }

    // Update the tenant
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: name.trim(),
        type,
        status,
        notes: notes?.trim() || null
      }
    });

    console.log('Tenant updated successfully:', tenant);

    // Return the updated tenant with counts
    const tenantWithCounts = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      include: {
        _count: {
          select: {
            users: true,
            businessUnits: true,
            accounts: true
          }
        }
      }
    });

    const transformedTenant = {
      ...tenantWithCounts,
      users: tenantWithCounts?._count.users || 0,
      businessUnits: tenantWithCounts?._count.businessUnits || 0,
      accounts: tenantWithCounts?._count.accounts || 0
    };

    res.json(transformedTenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// DELETE tenant (SYSTEM_ADMIN only)
router.delete('/:id', authenticateToken, requirePermission('tenants:delete'), async (req, res) => {
  try {
    const tenantId = req.params.id;

    console.log('Deleting tenant:', tenantId);

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            businessUnits: true,
            accounts: true
          }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check if tenant has associated data
    if (tenant._count.users > 0 || tenant._count.businessUnits > 0 || tenant._count.accounts > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete tenant with associated users, business units, or accounts' 
      });
    }

    await prisma.tenant.delete({
      where: { id: tenantId }
    });

    console.log('Tenant deleted successfully:', tenantId);

    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});

export default router; 