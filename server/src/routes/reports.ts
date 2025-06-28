import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get sales performance summary
router.get('/sales-summary', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      dateFilter = { createdAt: { gte: monthAgo } };
    } else if (period === 'quarter') {
      const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      dateFilter = { createdAt: { gte: quarterAgo } };
    } else if (period === 'year') {
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      dateFilter = { createdAt: { gte: yearAgo } };
    }

    const deals = await prisma.deal.findMany({
      where: dateFilter,
      include: {
        customer: true,
        assignedUser: true
      }
    });

    const totalDeals = deals.length;
    const totalValue = deals.reduce((sum, deal) => sum + deal.amount, 0);
    const closedWon = deals.filter(deal => deal.stage === 'closed-won');
    const closedWonValue = closedWon.reduce((sum, deal) => sum + deal.amount, 0);
    const winRate = totalDeals > 0 ? (closedWon.length / totalDeals) * 100 : 0;

    // Deals by stage
    const dealsByStage = await prisma.deal.groupBy({
      by: ['stage'],
      where: dateFilter,
      _count: { stage: true },
      _sum: { amount: true }
    });

    // Deals by type
    const dealsByType = await prisma.deal.groupBy({
      by: ['dealType'],
      where: dateFilter,
      _count: { dealType: true },
      _sum: { amount: true }
    });

    // Top performing users
    const userPerformance = await prisma.deal.groupBy({
      by: ['assignedTo'],
      where: dateFilter,
      _count: { assignedTo: true },
      _sum: { amount: true }
    });

    const userPerformanceWithNames = await Promise.all(
      userPerformance.map(async (user) => {
        const userData = await prisma.user.findUnique({
          where: { id: user.assignedTo || '' }
        });
        return {
          userId: user.assignedTo,
          userName: userData ? `${userData.firstName} ${userData.lastName}` : 'Unassigned',
          dealCount: user._count.assignedTo,
          totalValue: user._sum.amount || 0
        };
      })
    );

    res.json({
      summary: {
        totalDeals,
        totalValue,
        closedWonCount: closedWon.length,
        closedWonValue,
        winRate: Math.round(winRate * 100) / 100
      },
      dealsByStage,
      dealsByType,
      userPerformance: userPerformanceWithNames
    });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({ error: 'Failed to fetch sales summary' });
  }
});

// Get customer analytics
router.get('/customer-analytics', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany();
    const deals = await prisma.deal.findMany({
      include: { customer: true }
    });

    // Customer status distribution
    const statusDistribution = await prisma.customer.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    // Customer source distribution
    const sourceDistribution = await prisma.customer.groupBy({
      by: ['source'],
      _count: { source: true }
    });

    // Top customers by deal value
    const customerDealValues = deals.reduce((acc, deal) => {
      const customerId = deal.customerId;
      if (!acc[customerId]) {
        acc[customerId] = {
          customerId,
          customerName: `${deal.customer.firstName} ${deal.customer.lastName}`,
          company: deal.customer.company,
          totalValue: 0,
          dealCount: 0
        };
      }
      acc[customerId].totalValue += deal.amount;
      acc[customerId].dealCount += 1;
      return acc;
    }, {} as Record<string, any>);

    const topCustomers = Object.values(customerDealValues)
      .sort((a: any, b: any) => b.totalValue - a.totalValue)
      .slice(0, 10);

    // Customer acquisition over time
    const customerAcquisition = await prisma.customer.groupBy({
      by: ['createdAt'],
      _count: { createdAt: true }
    });

    res.json({
      totalCustomers: customers.length,
      statusDistribution,
      sourceDistribution,
      topCustomers,
      customerAcquisition
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({ error: 'Failed to fetch customer analytics' });
  }
});

// Get task analytics
router.get('/task-analytics', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany();
    const users = await prisma.user.findMany();

    // Task status distribution
    const statusDistribution = await prisma.task.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    // Task priority distribution
    const priorityDistribution = await prisma.task.groupBy({
      by: ['priority'],
      _count: { priority: true }
    });

    // User task load
    const userTaskLoad = await prisma.task.groupBy({
      by: ['assignedTo'],
      _count: { assignedTo: true }
    });

    const userTaskLoadWithNames = await Promise.all(
      userTaskLoad.map(async (user) => {
        const userData = await prisma.user.findUnique({
          where: { id: user.assignedTo || '' }
        });
        return {
          userId: user.assignedTo,
          userName: userData ? `${userData.firstName} ${userData.lastName}` : 'Unassigned',
          taskCount: user._count.assignedTo
        };
      })
    );

    // Overdue tasks
    const now = new Date();
    const overdueTasks = tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < now && task.status !== 'completed'
    );

    res.json({
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      overdueTasks: overdueTasks.length,
      statusDistribution,
      priorityDistribution,
      userTaskLoad: userTaskLoadWithNames
    });
  } catch (error) {
    console.error('Error fetching task analytics:', error);
    res.status(500).json({ error: 'Failed to fetch task analytics' });
  }
});

// Get pipeline analysis
router.get('/pipeline-analysis', async (req, res) => {
  try {
    const deals = await prisma.deal.findMany({
      include: { customer: true, assignedUser: true }
    });

    // Pipeline by stage
    const pipelineByStage = await prisma.deal.groupBy({
      by: ['stage'],
      _count: { stage: true },
      _sum: { amount: true }
    });

    // Average deal size by stage
    const avgDealSizeByStage = pipelineByStage.map(stage => ({
      stage: stage.stage,
      count: stage._count.stage,
      totalValue: stage._sum.amount || 0,
      avgValue: stage._count.stage > 0 ? (stage._sum.amount || 0) / stage._count.stage : 0
    }));

    // Conversion rates between stages
    const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
    const conversionRates = [];
    
    for (let i = 0; i < stages.length - 1; i++) {
      const currentStage = stages[i];
      const nextStage = stages[i + 1];
      
      const currentCount = deals.filter(d => d.stage === currentStage).length;
      const nextCount = deals.filter(d => d.stage === nextStage).length;
      
      const conversionRate = currentCount > 0 ? (nextCount / currentCount) * 100 : 0;
      
      conversionRates.push({
        fromStage: currentStage,
        toStage: nextStage,
        conversionRate: Math.round(conversionRate * 100) / 100
      });
    }

    // Time in each stage (average)
    const timeInStage = await prisma.deal.findMany({
      select: {
        stage: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const stageTimeAnalysis = stages.map(stage => {
      const stageDeals = timeInStage.filter(d => d.stage === stage);
      const avgTime = stageDeals.length > 0 
        ? stageDeals.reduce((sum, deal) => {
            const timeDiff = new Date(deal.updatedAt).getTime() - new Date(deal.createdAt).getTime();
            return sum + timeDiff;
          }, 0) / stageDeals.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;
      
      return {
        stage,
        avgTimeInDays: Math.round(avgTime * 100) / 100
      };
    });

    res.json({
      pipelineByStage: avgDealSizeByStage,
      conversionRates,
      timeInStage: stageTimeAnalysis
    });
  } catch (error) {
    console.error('Error fetching pipeline analysis:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline analysis' });
  }
});

// Get revenue forecast
router.get('/revenue-forecast', async (req, res) => {
  try {
    const deals = await prisma.deal.findMany({
      where: {
        stage: {
          in: ['prospecting', 'qualification', 'proposal', 'negotiation']
        }
      },
      include: { customer: true }
    });

    // Weighted pipeline value
    const weightedPipeline = deals.reduce((total, deal) => {
      const probability = deal.probability / 100;
      return total + (deal.amount * probability);
    }, 0);

    // Deals closing this month
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const dealsClosingThisMonth = deals.filter(deal => 
      deal.expectedCloseDate && 
      new Date(deal.expectedCloseDate) >= thisMonth &&
      new Date(deal.expectedCloseDate) < nextMonth
    );

    const expectedRevenueThisMonth = dealsClosingThisMonth.reduce((total, deal) => {
      const probability = deal.probability / 100;
      return total + (deal.amount * probability);
    }, 0);

    // Deals closing next month
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    
    const dealsClosingNextMonth = deals.filter(deal => 
      deal.expectedCloseDate && 
      new Date(deal.expectedCloseDate) >= nextMonthStart &&
      new Date(deal.expectedCloseDate) < nextMonthEnd
    );

    const expectedRevenueNextMonth = dealsClosingNextMonth.reduce((total, deal) => {
      const probability = deal.probability / 100;
      return total + (deal.amount * probability);
    }, 0);

    res.json({
      totalPipelineValue: deals.reduce((sum, deal) => sum + deal.amount, 0),
      weightedPipelineValue: Math.round(weightedPipeline * 100) / 100,
      expectedRevenueThisMonth: Math.round(expectedRevenueThisMonth * 100) / 100,
      expectedRevenueNextMonth: Math.round(expectedRevenueNextMonth * 100) / 100,
      dealsClosingThisMonth: dealsClosingThisMonth.length,
      dealsClosingNextMonth: dealsClosingNextMonth.length
    });
  } catch (error) {
    console.error('Error fetching revenue forecast:', error);
    res.status(500).json({ error: 'Failed to fetch revenue forecast' });
  }
});

export default router;