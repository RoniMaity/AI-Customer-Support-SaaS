import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { company_name, email, password } = req.body;

  if (!company_name || !email || !password) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const existingUser = await prisma.userAdmin.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create Tenant and Admin User using a Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { company_name },
      });

      const user = await tx.userAdmin.create({
        data: {
          tenant_id: tenant.id,
          email,
          password_hash: passwordHash,
        },
      });

      // Optionally create a default bot config for the new tenant
      await tx.botConfig.create({
        data: {
          tenant_id: tenant.id,
        },
      });

      return { tenant, user };
    });

    res.status(201).json({
      message: 'Tenant and user created successfully',
      tenantId: result.tenant.id,
      userId: result.user.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const user = await prisma.userAdmin.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
