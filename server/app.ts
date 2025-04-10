import express from 'express';
import cors from 'cors';
import attendanceRouter from './routes/attendance';

const app = express();

app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/attendance', attendanceRouter);

// Default port
const PORT = process.env.PORT || 3000;

// Export for testing
export default app; 