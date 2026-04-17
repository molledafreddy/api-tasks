import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una tarea' })
  @ApiCreatedResponse({ description: 'Tarea creada exitosamente' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tareas del usuario (paginado, filtro por status)' })
  @ApiOkResponse({ description: 'Lista paginada de tareas' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryTasksDto,
  ) {
    return this.tasksService.findAll(user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una tarea por ID' })
  @ApiOkResponse({ description: 'Tarea encontrada' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasksService.findOne(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una tarea' })
  @ApiOkResponse({ description: 'Tarea actualizada' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una tarea' })
  @ApiNoContentResponse({ description: 'Tarea eliminada' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasksService.remove(user.userId, id);
  }
}
