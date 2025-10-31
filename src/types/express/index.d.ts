import { Role } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface User extends JwtPayload {
      sub: string;
      role: Role;
    }
  }
}

export type Payload = Express.User;
