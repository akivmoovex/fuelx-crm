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

const app = express();

// Add CORS middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend port
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

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});