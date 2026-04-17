import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Comprar leche desnatada', maxLength: 160 })
  @IsString()
  @IsOptional()
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional({ example: 'Actualizar descripción' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.DONE })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
