import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;

  const jwtService = {
    sign: jest.fn(() => 'mock-jwt-token'),
  } as any;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma, jwtService);
  });

  it('register should throw when phone already exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', phone: '13800001234' });

    await expect(
      service.register({ name: '张三', phone: '13800001234', password: '123456' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('register should create user and return token', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const tx = {
      user: {
        create: jest.fn().mockResolvedValue({
          id: 'u1',
          name: '张三',
          phone: '13800001234',
          passwordHash: 'hash',
        }),
      },
      category: {
        createMany: jest.fn().mockResolvedValue({ count: 8 }),
      },
    };

    prisma.$transaction.mockImplementation(async (callback: any) => callback(tx));

    const result = await service.register({
      name: '张三',
      phone: '13800001234',
      password: '123456',
    });

    expect(result.token).toBe('mock-jwt-token');
    expect(result.user.phone).toBe('13800001234');
    expect(tx.category.createMany).toHaveBeenCalledTimes(1);
  });

  it('login should throw when password is wrong', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      name: '张三',
      phone: '13800001234',
      passwordHash,
    });

    await expect(service.login({ phone: '13800001234', password: 'wrong-password' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('login should return token and safe user', async () => {
    const passwordHash = await bcrypt.hash('123456', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      name: '张三',
      phone: '13800001234',
      passwordHash,
    });

    const result = await service.login({ phone: '13800001234', password: '123456' });

    expect(result.token).toBe('mock-jwt-token');
    expect(result.user).toEqual({
      id: 'u1',
      name: '张三',
      phone: '13800001234',
    });
  });
});
