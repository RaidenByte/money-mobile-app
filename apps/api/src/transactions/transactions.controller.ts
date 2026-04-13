import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpsertTransactionDto } from './dto/upsert-transaction.dto';
import { TransactionsService } from './transactions.service';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.transactionsService.list(userId);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: UpsertTransactionDto) {
    return this.transactionsService.create(userId, dto);
  }

  @Put(':id')
  update(@CurrentUserId() userId: string, @Param('id') id: string, @Body() dto: UpsertTransactionDto) {
    return this.transactionsService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.transactionsService.remove(userId, id);
  }
}
