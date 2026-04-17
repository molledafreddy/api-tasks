import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'node:crypto';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { CacheService } from '../cache/cache.service';
import { AppConfigService } from '../../config/app-config.service';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly cacheTtl: number;

  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly cache: CacheService,
    private readonly cfg: AppConfigService,
  ) {
    this.cacheTtl = this.cfg.get('CACHE_TTL_SECONDS');
  }

  // ─── Cache key helpers ────────────────────────────────────

  private cacheKey(userId: string, query: QueryTasksDto): string {
    const hash = createHash('sha1')
      .update(JSON.stringify({ s: query.status, p: query.page, l: query.limit }))
      .digest('hex')
      .slice(0, 12);
    return `tasks:user:${userId}:list:${hash}`;
  }

  private cachePattern(userId: string): string {
    return `tasks:user:${userId}:list:*`;
  }

  private async invalidateUserCache(userId: string): Promise<void> {
    const deleted = await this.cache.delByPattern(this.cachePattern(userId));
    this.logger.debug(`cache.invalidate userId=${userId} deleted=${deleted} keys`);
  }

  // ─── CRUD ─────────────────────────────────────────────────

  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepo.create({ ...dto, userId });
    const saved = await this.taskRepo.save(task);
    await this.invalidateUserCache(userId);
    this.logger.log(`Task created: ${saved.id} by user ${userId}`);
    return saved;
  }

  async findAll(
    userId: string,
    query: QueryTasksDto,
  ): Promise<PaginatedResult<Task>> {
    const key = this.cacheKey(userId, query);

    // Cache hit
    const cached = await this.cache.get<PaginatedResult<Task>>(key);
    if (cached) {
      this.logger.debug(`cache.hit key=${key}`);
      return cached;
    }
    this.logger.debug(`cache.miss key=${key}`);

    // DB query
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.taskRepo
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId });

    if (query.status) {
      qb.andWhere('task.status = :status', { status: query.status });
    }

    qb.orderBy('task.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    const result: PaginatedResult<Task> = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // Cache set
    await this.cache.set(key, result, this.cacheTtl);

    return result;
  }

  async findOne(userId: string, taskId: string): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, userId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(
    userId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.findOne(userId, taskId);
    Object.assign(task, dto);
    const saved = await this.taskRepo.save(task);
    await this.invalidateUserCache(userId);
    return saved;
  }

  async remove(userId: string, taskId: string): Promise<void> {
    const task = await this.findOne(userId, taskId);
    await this.taskRepo.remove(task);
    await this.invalidateUserCache(userId);
    this.logger.log(`Task deleted: ${taskId} by user ${userId}`);
  }
}
