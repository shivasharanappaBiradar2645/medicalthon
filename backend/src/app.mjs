import express from 'express'
import cors from 'cors'
import path from 'path';
import { fileURLToPath } from 'url';
import medicinesRouter from './routes/medicines.mjs'
import pharmaciesRouter from './routes/pharmacies.mjs'
import prescriptionsRouter from './routes/prescriptions.mjs'
import patientsRouter from './routes/patients.mjs'
import doctorsRouter from './routes/doctors.mjs'
import usersRouter from './routes/users.mjs'
import prescriptionFillsRouter from './routes/prescriptionFills.mjs'
import distributorsRouter from './routes/distributors.mjs'
import restockOrdersRouter from './routes/restockOrders.mjs'
import notificationsRouter from './routes/notifications.mjs'
import adherenceLogsRouter from './routes/adherenceLogs.mjs'
import { startInventoryWorker } from './services/inventoryWorker.mjs';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: true }));

// API routes
app.use('/api/medicines', medicinesRouter);
app.use('/api/pharmacies', pharmaciesRouter);
app.use('/api/prescriptions', prescriptionsRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/users', usersRouter);
app.use('/api/prescription-fills', prescriptionFillsRouter);
app.use('/api/distributors', distributorsRouter);
app.use('/api/restock-orders', restockOrdersRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/adherence-logs', adherenceLogsRouter);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// The catch-all is removed to avoid the path-to-regexp error.
// The static middleware will serve index.html for the root route.

startInventoryWorker();

export default app;

