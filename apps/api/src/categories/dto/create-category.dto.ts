import { TransactionType } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(TransactionType, { message: '分类类型必须是 income 或 expense' })
  type!: TransactionType;
}
