import express from 'express';
import customersRouter from './routes/customers';
import usersRouter from './routes/users';
import tasksRouter from './routes/tasks';
const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/customers', customersRouter);

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
