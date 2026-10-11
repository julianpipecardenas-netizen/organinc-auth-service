require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./authRoutes');

if (!process.env.JWT_SECRET) {
  throw new Error('Falta JWT_SECRET en las variables de entorno. Revisa tu archivo .env.');
}

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'organinc-auth-service' });
});

app.use('/api', authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`organinc-auth-service escuchando en el puerto ${PORT}`);
});
