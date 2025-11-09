import express from 'express'
import cors from 'cors'
import medicinesRouter from './routes/medicines.mjs'
import pharmaciesRouter from './routes/pharmacies.mjs'
import prescriptionsRouter from './routes/prescriptions.mjs'
import patientsRouter from './routes/patients.mjs'
import doctorsRouter from './routes/doctors.mjs'
import usersRouter from './routes/users.mjs'
import transactionsRouter from './routes/transactions.mjs'

const app = express();

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: true }));

app.use('/api/medicines', medicinesRouter);
app.use('/api/pharmacies', pharmaciesRouter);
app.use('/api/prescriptions', prescriptionsRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/users', usersRouter);
app.use('/api/transactions', transactionsRouter);

export default app;

