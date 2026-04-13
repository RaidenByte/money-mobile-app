import { PrismaClient, TransactionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

const toDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

async function main() {
  const phone = '13800001234';
  const passwordHash = await bcrypt.hash('123456', 10);

  const user = await prisma.user.upsert({
    where: { phone },
    update: { name: '李雷', passwordHash },
    create: {
      name: '李雷',
      phone,
      passwordHash,
    },
  });

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: {
        userId_name_type: {
          userId: user.id,
          name: category.name,
          type: category.type,
        },
      },
      update: {},
      create: {
        userId: user.id,
        name: category.name,
        type: category.type,
      },
    });
  }

  const categoryMap = new Map(
    (
      await prisma.category.findMany({
        where: { userId: user.id },
      })
    ).map((item) => [`${item.name}:${item.type}`, item.id]),
  );

  const existing = await prisma.transaction.count({ where: { userId: user.id } });
  if (existing === 0) {
    await prisma.transaction.createMany({
      data: [
        {
          userId: user.id,
          amount: 12800,
          type: 'income',
          categoryId: categoryMap.get('工资:income')!,
          date: toDate('2026-04-01'),
          note: '4月工资',
        },
        {
          userId: user.id,
          amount: 68,
          type: 'expense',
          categoryId: categoryMap.get('餐饮:expense')!,
          date: toDate('2026-04-02'),
          note: '午饭',
        },
        {
          userId: user.id,
          amount: 25,
          type: 'expense',
          categoryId: categoryMap.get('交通:expense')!,
          date: toDate('2026-04-03'),
          note: '地铁',
        },
      ],
    });
  }

  console.log('Seed completed. Demo account: 13800001234 / 123456');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
