import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class CreateTaskDto {
  @ApiProperty({ example: 'Comprar leche', maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional({ example: 'Ir al supermercado y comprar leche desnatada' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.PENDING })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
