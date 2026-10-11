const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('./supabaseClient');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function validateCredentials(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') {
    return 'Usuario y contraseña son obligatorios.';
  }
  if (username.trim().length < 3) {
    return 'El usuario debe tener al menos 3 caracteres.';
  }
  if (password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  return null;
}

// POST /api/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body ?? {};

  const validationError = validateCredentials(username, password);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const normalizedUsername = username.trim().toLowerCase();

  try {
    const { data: existing, error: lookupError } = await supabase
      .from('users')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (existing) {
      return res.status(409).json({ error: 'Ese usuario ya existe.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const { data: created, error: insertError } = await supabase
      .from('users')
      .insert({ username: normalizedUsername, password_hash: passwordHash })
      .select('id, username')
      .single();

    if (insertError) throw insertError;

    const token = signToken(created);
    return res.status(201).json({ token, user: created });
  } catch (err) {
    console.error('Error en /register:', err.message);
    return res.status(500).json({ error: 'No se pudo completar el registro.' });
  }
});

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  const validationError = validateCredentials(username, password);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const normalizedUsername = username.trim().toLowerCase();

  try {
    const { data: user, error: lookupError } = await supabase
      .from('users')
      .select('id, username, password_hash')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error('Error en /login:', err.message);
    return res.status(500).json({ error: 'No se pudo iniciar sesión.' });
  }
});

// GET /api/me — valida un token y devuelve el usuario asociado.
// Útil para que la app confirme la sesión al reabrir (fase posterior).
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Falta el token de autorización.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return res.json({ id: payload.sub, username: payload.username });
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
});

module.exports = router;
