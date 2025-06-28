import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reports/summary
router.get('/summary', async (req, res) => {
  try {
    const [accounts, deals, tasks, customers] = await Promise.all([
      prisma.account.count(),
      prisma.deal.count(),
      prisma.task.count(),
      prisma.customer.count()
    ]);

    const totalRevenue = await prisma.deal.aggregate({
      _sum: { amount: true },
      where: { stage: 'closed-won' }
    });

    const activeDeals = await prisma.deal.count({
      where: {
        stage: {
          in: ['prospecting', 'qualification', 'proposal', 'negotiation']
        }
      }
    });

    const pendingTasks = await prisma.task.count({
      where: { status: 'pending' }
    });

    res.json({
      totalAccounts: accounts,
      totalCustomers: customers,
      totalDeals: deals,
      totalTasks: tasks,
      totalRevenue: totalRevenue._sum.amount || 0,
      activeDeals,
      pendingTasks
    });
  } catch (error) {
    console.error('Error fetching summary report:', error);
    res.status(500).json({ error: 'Failed to fetch summary report' });
  }
});

// GET /api/reports/revenue-by-account
router.get('/revenue-by-account', async (req, res) => {
  try {
    const deals = await prisma.deal.findMany({
      where: { stage: 'closed-won' },
      select: {
        accountId: true,
        amount: true,
        account: { select: { name: true } }
      }
    });

    const revenueMap: { [key: string]: { name: string; total: number } } = {};
    deals.forEach(deal => {
      if (deal.accountId && deal.account) {
        if (!revenueMap[deal.accountId]) {
          revenueMap[deal.accountId] = { name: deal.account.name, total: 0 };
        }
        revenueMap[deal.accountId].total += deal.amount;
      }
    });

    res.json(Object.values(revenueMap));
  } catch (error) {
    console.error('Error fetching revenue by account:', error);
    res.status(500).json({ error: 'Failed to fetch revenue by account' });
  }
});

// GET /api/reports/deals-by-stage
router.get('/deals-by-stage', async (req, res) => {
  try {
    const stages = [
      'prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost'
    ];

    const counts = await Promise.all(
      stages.map(stage =>
        prisma.deal.count({ where: { stage } })
      )
    );

    res.json(stages.map((stage, i) => ({ stage, count: counts[i] })));
  } catch (error) {
    console.error('Error fetching deals by stage:', error);
    res.status(500).json({ error: 'Failed to fetch deals by stage' });
  }
});

// GET /api/reports/tasks-by-status
router.get('/tasks-by-status', async (req, res) => {
  try {
    const statuses = ['pending', 'in-progress', 'completed', 'cancelled'];
    const counts = await Promise.all(
      statuses.map(status =>
        prisma.task.count({ where: { status } })
      )
    );

    res.json(statuses.map((status, i) => ({ status, count: counts[i] })));
  } catch (error) {
    console.error('Error fetching tasks by status:', error);
    res.status(500).json({ error: 'Failed to fetch tasks by status' });
  }
});

// GET /api/reports/monthly-revenue
router.get('/monthly-revenue', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const monthlyData = [];

    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(currentYear, month - 1, 1);
      const endDate = new Date(currentYear, month, 0);

      const revenue = await prisma.deal.aggregate({
        _sum: { amount: true },
        where: {
          stage: 'closed-won',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      monthlyData.push({
        month: new Date(currentYear, month - 1).toLocaleString('default', { month: 'short' }),
        revenue: revenue._sum.amount || 0
      });
    }

    res.json(monthlyData);
  } catch (error) {
    console.error('Error fetching monthly revenue:', error);
    res.status(500).json({ error: 'Failed to fetch monthly revenue' });
  }
});

// GET /api/reports/accounts-by-status
router.get('/accounts-by-status', async (req, res) => {
  try {
    const statuses = ['active', 'inactive', 'suspended'];
    const counts = await Promise.all(
      statuses.map(status =>
        prisma.account.count({ where: { status } })
      )
    );

    res.json(statuses.map((status, i) => ({ status, count: counts[i] })));
  } catch (error) {
    console.error('Error fetching accounts by status:', error);
    res.status(500).json({ error: 'Failed to fetch accounts by status' });
  }
});

// GET /api/reports/top-performers
router.get('/top-performers', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        deals: {
          where: { stage: 'closed-won' },
          select: { amount: true }
        }
      }
    });

    const performers = users
      .map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        revenue: user.deals.reduce((sum, deal) => sum + deal.amount, 0)
      }))
      .filter(user => user.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.json(performers);
  } catch (error) {
    console.error('Error fetching top performers:', error);
    res.status(500).json({ error: 'Failed to fetch top performers' });
  }
});

export default router;