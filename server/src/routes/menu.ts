import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { PERMISSIONS } from '../utils/permissions';

const router = express.Router();
const prisma = new PrismaClient();

// GET menu items for current user's role
router.get('/my-menu', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    const tenantId = req.user.tenantId;

    // Get menu items visible to this role
    const menuItems = await prisma.menuItem.findMany({
      where: {
        isActive: true,
        OR: [
          { tenantId: null }, // Global menu items
          { tenantId: tenantId } // Tenant-specific menu items
        ],
        roleMenuItems: {
          some: {
            role: userRole,
            isVisible: true,
            isEnabled: true
          }
        }
      },
      include: {
        roleMenuItems: {
          where: { role: userRole }
        },
        children: {
          where: {
            isActive: true,
            roleMenuItems: {
              some: {
                role: userRole,
                isVisible: true,
                isEnabled: true
              }
            }
          },
          include: {
            roleMenuItems: {
              where: { role: userRole }
            }
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });

    // Sort by role-specific order
    const sortedMenuItems = menuItems.sort((a, b) => {
      const aOrder = a.roleMenuItems[0]?.order ?? a.order;
      const bOrder = b.roleMenuItems[0]?.order ?? b.order;
      return aOrder - bOrder;
    });

    res.json(sortedMenuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// GET all menu items (admin only)
router.get('/', authenticateToken, requirePermission(PERMISSIONS.TENANTS_READ), async (req, res) => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      include: {
        roleMenuItems: true,
        children: {
          include: {
            roleMenuItems: true
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });

    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching all menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// POST create new menu item (admin only)
router.post('/', authenticateToken, requirePermission(PERMISSIONS.TENANTS_WRITE), async (req, res) => {
  try {
    const { label, path, icon, order, parentId, tenantId, roleConfigurations } = req.body;

    const menuItem = await prisma.menuItem.create({
      data: {
        label,
        path,
        icon,
        order: order || 0,
        parentId,
        tenantId,
        roleMenuItems: {
          create: roleConfigurations?.map((config: any) => ({
            role: config.role,
            isVisible: config.isVisible ?? true,
            isEnabled: config.isEnabled ?? true,
            order: config.order ?? 0
          })) || []
        }
      },
      include: {
        roleMenuItems: true
      }
    });

    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// PUT update menu item (admin only)
router.put('/:id', authenticateToken, requirePermission(PERMISSIONS.TENANTS_WRITE), async (req, res) => {
  try {
    const { id } = req.params;
    const { label, path, icon, order, parentId, tenantId, isActive, roleConfigurations } = req.body;

    // Update menu item
    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        label,
        path,
        icon,
        order: order || 0,
        parentId,
        tenantId,
        isActive
      }
    });

    // Update role configurations if provided
    if (roleConfigurations) {
      // Delete existing role configurations
      await prisma.roleMenuItem.deleteMany({
        where: { menuItemId: id }
      });

      // Create new role configurations
      await prisma.roleMenuItem.createMany({
        data: roleConfigurations.map((config: any) => ({
          menuItemId: id,
          role: config.role,
          isVisible: config.isVisible ?? true,
          isEnabled: config.isEnabled ?? true,
          order: config.order ?? 0
        }))
      });
    }

    const updatedMenuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        roleMenuItems: true
      }
    });

    res.json(updatedMenuItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// DELETE menu item (admin only)
router.delete('/:id', authenticateToken, requirePermission(PERMISSIONS.TENANTS_DELETE), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.menuItem.delete({
      where: { id }
    });

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

export default router; 