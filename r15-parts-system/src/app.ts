import express from 'express';
import cors from 'cors';
import partRoutes from './routes/part.route';
import authRoutes from './routes/auth.route';
import expenseRoutes from './routes/expense.route';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Endpoints
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/parts', partRoutes);
app.use('/api/v1/expenses', expenseRoutes);

app.get('/', (req, res) => {
  res.send('R15 Part & Expense Management API is Running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});