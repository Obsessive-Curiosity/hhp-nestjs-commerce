import { PrismaService } from '@/prisma/prisma.service';
import { Payload } from '@/types/express';
import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProductDto) {
    const { stock, ...rest } = dto;

    return this.prisma.product.create({
      data: {
        ...rest,
        stock: { create: { quantity: stock } },
      },
    });
  }

  update(id: string, dto: UpdateProductDto) {
    const { stock, ...rest } = dto;
    const hasStock = stock !== undefined;

    return this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(hasStock && {
          stock: { update: { quantity: stock } },
        }),
      },
    });
  }

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
