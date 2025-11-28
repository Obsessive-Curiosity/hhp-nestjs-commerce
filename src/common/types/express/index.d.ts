import { Role } from '@/modules/user/domain/entity/user.entity';
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
