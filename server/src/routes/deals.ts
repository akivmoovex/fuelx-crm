import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all deals with customer and assigned user info
router.get('/', async (req, res) => {
  try {
    const deals = await prisma.deal.findMany({
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
            email: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// Get a single deal by ID
router.get('/:id', async (req, res) => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: req.params.id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
            email: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    res.json(deal);
  } catch (error) {
    console.error('Error fetching deal:', error);
    res.status(500).json({ error: 'Failed to fetch deal' });
  }
});

// Create a new deal
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      currency,
      stage,
      probability,
      expectedCloseDate,
      actualCloseDate,
      customerId,
      assignedTo,
      source,
      notes,
      dealType,
      litresPerMonth,
      insuranceType
    } = req.body;

    // Validate required fields
    if (!title || !amount || !customerId) {
      return res.status(400).json({ 
        error: 'Title, amount, and customerId are required' 
      });
    }

    // Validate amount is a positive number
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be a positive number' 
      });
    }

    // Validate deal type specific fields
    if (dealType === 'fuel' && !litresPerMonth) {
      return res.status(400).json({ 
        error: 'Litres per month is required for fuel deals' 
      });
    }

    if (dealType === 'insurance' && !insuranceType) {
      return res.status(400).json({ 
        error: 'Insurance type is required for insurance deals' 
      });
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return res.status(400).json({ 
        error: `Customer with ID ${customerId} not found` 
      });
    }

    // Check if assigned user exists (if provided)
    if (assignedTo) {
      const user = await prisma.user.findUnique({
        where: { id: assignedTo }
      });

      if (!user) {
        return res.status(400).json({ 
          error: `User with ID ${assignedTo} not found` 
        });
      }
    }

    const deal = await prisma.deal.create({
      data: {
        title,
        description: description || null,
        amount: parseFloat(amount),
        currency: currency || 'ZMW',
        stage: stage || 'prospecting',
        probability: probability ? parseInt(probability) : 0,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        actualCloseDate: actualCloseDate ? new Date(actualCloseDate) : null,
        customerId,
        assignedTo: assignedTo || null,
        source: source || null,
        notes: notes || null,
        dealType: dealType || 'fuel',
        litresPerMonth: dealType === 'fuel' ? parseInt(litresPerMonth) || null : null,
        insuranceType: dealType === 'insurance' ? insuranceType || null : null
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
            email: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(deal);
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ 
      error: 'Failed to create deal',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update a deal
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      currency,
      stage,
      probability,
      expectedCloseDate,
      actualCloseDate,
      customerId,
      assignedTo,
      source,
      notes,
      dealType,
      litresPerMonth,
      insuranceType
    } = req.body;

    // Check if deal exists
    const existingDeal = await prisma.deal.findUnique({
      where: { id: req.params.id }
    });

    if (!existingDeal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Validate required fields
    if (!title || !amount || !customerId) {
      return res.status(400).json({ 
        error: 'Title, amount, and customerId are required' 
      });
    }

    // Validate amount is a positive number
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be a positive number' 
      });
    }

    // Validate deal type specific fields
    if (dealType === 'fuel' && !litresPerMonth) {
      return res.status(400).json({ 
        error: 'Litres per month is required for fuel deals' 
      });
    }

    if (dealType === 'insurance' && !insuranceType) {
      return res.status(400).json({ 
        error: 'Insurance type is required for insurance deals' 
      });
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return res.status(400).json({ 
        error: `Customer with ID ${customerId} not found` 
      });
    }

    // Check if assigned user exists (if provided)
    if (assignedTo) {
      const user = await prisma.user.findUnique({
        where: { id: assignedTo }
      });

      if (!user) {
        return res.status(400).json({ 
          error: `User with ID ${assignedTo} not found` 
        });
      }
    }

    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: {
        title,
        description: description || null,
        amount: parseFloat(amount),
        currency: currency || 'ZMW',
        stage: stage || 'prospecting',
        probability: probability ? parseInt(probability) : 0,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        actualCloseDate: actualCloseDate ? new Date(actualCloseDate) : null,
        customerId,
        assignedTo: assignedTo || null,
        source: source || null,
        notes: notes || null,
        dealType: dealType || 'fuel',
        litresPerMonth: dealType === 'fuel' ? parseInt(litresPerMonth) || null : null,
        insuranceType: dealType === 'insurance' ? insuranceType || null : null
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
            email: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json(deal);
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({ 
      error: 'Failed to update deal',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a deal
router.delete('/:id', async (req, res) => {
  try {
    // Check if deal exists
    const existingDeal = await prisma.deal.findUnique({
      where: { id: req.params.id }
    });

    if (!existingDeal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    await prisma.deal.delete({ 
      where: { id: req.params.id } 
    });

    res.json({ success: true, message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Error deleting deal:', error);
    res.status(500).json({ 
      error: 'Failed to delete deal',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;