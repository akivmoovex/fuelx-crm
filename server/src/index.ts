import express from 'express';
import customersRouter from './routes/customers';

const app = express();
app.use(express.json());

app.use('/api/customers', customersRouter);

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
