import { PrismaService } from '@/prisma/prisma.service';
import { Payload } from '@/types/express';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductAdminService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: Payload | undefined) {
    return user;
  }

  findOne(user: Payload | undefined, id: string) {
    return { user, id };
  }
}
