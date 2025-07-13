import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import customersRouter from './routes/customers';
import usersRouter from './routes/users';
import tasksRouter from './routes/tasks';
import dealsRouter from './routes/deals';
import reportsRouter from './routes/reports';
import businessUnitsRouter from './routes/businessunits';
import accountsRouter from './routes/accounts';
import tenantsRouter from './routes/tenants';
import menuRouter from './routes/menu';

const app = express();

// Add CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Auth routes
app.use('/api/auth', authRouter);

// Other routes
app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/customers', customersRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/business-units', businessUnitsRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/tenants', tenantsRouter);
app.use('/api/menu', menuRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});