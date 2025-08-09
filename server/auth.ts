import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export class AuthService {
  private static SALT_ROUNDS = 12;

  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a password reset token
   */
  static generateResetToken(): string {
    return randomUUID();
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate team name
   */
  static validateTeamName(teamName: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!teamName || teamName.trim().length === 0) {
      errors.push('Team name is required');
    }

    if (teamName.length < 3) {
      errors.push('Team name must be at least 3 characters long');
    }

    if (teamName.length > 50) {
      errors.push('Team name must be less than 50 characters');
    }

    if (!/^[a-zA-Z0-9\s\-_]+$/.test(teamName)) {
      errors.push('Team name can only contain letters, numbers, spaces, hyphens, and underscores');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}