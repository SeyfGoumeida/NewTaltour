import bcrypt from 'bcrypt';
import { pool } from '../index';
import { generateToken } from '../middleware/auth';

const SALT_ROUNDS = 12;

export const authService = {
  async register(email: string, password: string, nom: string, prenom: string) {
    // Validate input
    if (!email || !password || !nom || !prenom) {
      throw new Error('Missing required fields');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM contacts WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const result = await pool.query(
      `INSERT INTO contacts (email, password_hash, nom, prenom, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, email, nom, prenom, role, created_at`,
      [email.toLowerCase(), passwordHash, nom, prenom]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    return { token, user };
  },

  async login(email: string, password: string) {
    // Validate input
    if (!email || !password) {
      throw new Error('Missing email or password');
    }

    // Get user
    const result = await pool.query(
      'SELECT id, email, nom, prenom, password_hash, role FROM contacts WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      throw new Error('Invalid email or password');
    }

    const token = generateToken(user.id);

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    return { token, user: userWithoutPassword };
  },

  async getUser(userId: number) {
    const result = await pool.query(
      `SELECT id, email, nom, prenom, tel, adresse, ville, code_postal, pays,
              date_naissance, num_permis, date_permis, role, created_at, updated_at
       FROM contacts WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  },

  async updateProfile(userId: number, data: any) {
    // Build dynamic query (security: only allow specific fields)
    const allowedFields = [
      'tel', 'adresse', 'ville', 'code_postal', 'pays',
      'date_naissance', 'num_permis', 'date_permis'
    ];

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const result = await pool.query(
      `UPDATE contacts SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const { password_hash, ...user } = result.rows[0];
    return user;
  },

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters');
    }

    // Get user
    const result = await pool.query(
      'SELECT password_hash FROM contacts WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    // Verify old password
    const passwordMatch = await bcrypt.compare(oldPassword, result.rows[0].password_hash);

    if (!passwordMatch) {
      throw new Error('Incorrect current password');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await pool.query(
      'UPDATE contacts SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    return { message: 'Password changed successfully' };
  },
};
