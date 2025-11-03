import { PrismaService } from '@/prisma/prisma.service';
import { Payload } from '@/types/express';
import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class ProductCustomerService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: Payload | undefined) {
    const { role } = user || {};
    const { isB2C, isB2B } = this.getRolePermissions(role);

    return this.prisma.product.findMany({
      select: {
        id: true,
        category: true,
        imageUrl: true,
        name: true,
        description: true,
        stock: true,
        retailPrice: isB2C,
        wholesalePrice: isB2B,
      },
    });
  }

  findOne(user: Payload | undefined, id: string) {
    const { role } = user || {};
    const { isB2C, isB2B } = this.getRolePermissions(role);

    return this.prisma.product.findUnique({
      where: { id },
      include: {
        promotions: isB2B,
        coupons: {
          include: {
            coupon: isB2C,
          },
        },
      },
    });
  }

  private getRolePermissions(role: Role | undefined) {
    const isB2C = !role || role === Role.RETAILER || role === Role.ADMIN;
    const isB2B = role && (role === Role.WHOLESALER || role === Role.ADMIN);

    return { isB2C, isB2B };
  }
}
