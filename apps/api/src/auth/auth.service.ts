import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma, TransactionType, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const defaultCategories: Array<{ name: string; type: TransactionType }> = [
  { name: '工资', type: 'income' },
  { name: '奖金', type: 'income' },
  { name: '理财收益', type: 'income' },
  { name: '餐饮', type: 'expense' },
  { name: '交通', type: 'expense' },
  { name: '购物', type: 'expense' },
  { name: '住房', type: 'expense' },
  { name: '娱乐', type: 'expense' },
];

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) {
      throw new ConflictException('手机号已注册');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.user.create({
        data: {
          name: dto.name.trim(),
          phone: dto.phone,
          passwordHash,
        },
      });

      await tx.category.createMany({
        data: defaultCategories.map((item) => ({
          userId: created.id,
          name: item.name,
          type: item.type,
        })),
      });

      return created;
    });

    return this.buildAuthPayload(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const matched = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matched) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    return this.buildAuthPayload(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return this.toSafeUser(user);
  }

  private buildAuthPayload(user: User) {
    const token = this.jwtService.sign({ sub: user.id });
    return {
      token,
      user: this.toSafeUser(user),
    };
  }

  private toSafeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
    };
  }
}
