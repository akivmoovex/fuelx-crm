import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all customers
router.get('/', async (req, res) => {
  const customers = await prisma.customer.findMany();
  res.json(customers);
});

// Get a single customer by ID
router.get('/:id', async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id }
  });
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

// Create a new customer
router.post('/', async (req, res) => {
  const customer = await prisma.customer.create({ data: req.body });
  res.json(customer);
});

// Update a customer
router.put('/:id', async (req, res) => {
  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json(customer);
});

// Delete a customer
router.delete('/:id', async (req, res) => {
  await prisma.customer.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
