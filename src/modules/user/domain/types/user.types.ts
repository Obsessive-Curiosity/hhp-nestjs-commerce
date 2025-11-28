import { PhoneNumber, Role } from '../entity/user.entity';

export type CreateUserProps = {
  role?: Role;
  email: string;
  password: string;
  name: string;
  phone: string;
  companyPhone?: string;
};

export type UpdateUserProps = {
  name?: string;
  personalPhone?: PhoneNumber;
  companyPhone?: PhoneNumber | null;
  currentPassword?: string;
  newPassword?: string;
};
