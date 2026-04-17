import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from './entities/task.entity';
import { CacheService } from '../cache/cache.service';
import { AppConfigService } from '../../config/app-config.service';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const TASK_ID = '22222222-2222-2222-2222-222222222222';

const mockTask: Task = {
  id: TASK_ID,
  title: 'Test task',
  description: null,
  status: TaskStatus.PENDING,
  userId: USER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: undefined as any,
};

// ─── Mocks ──────────────────────────────────────────────

const mockRepo = {
  create: jest.fn().mockReturnValue(mockTask),
  save: jest.fn().mockResolvedValue(mockTask),
  findOne: jest.fn(),
  remove: jest.fn().mockResolvedValue(undefined),
  createQueryBuilder: jest.fn(),
};

const mockCache = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  delByPattern: jest.fn().mockResolvedValue(0),
};

const mockConfig = {
  get: jest.fn().mockReturnValue(60),
};

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: mockRepo },
        { provide: CacheService, useValue: mockCache },
        { provide: AppConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  // ─── create ───────────────────────────────────────────

  describe('create', () => {
    it('should create a task and invalidate cache', async () => {
      const dto = { title: 'New task' };
      const result = await service.create(USER_ID, dto);

      expect(mockRepo.create).toHaveBeenCalledWith({ ...dto, userId: USER_ID });
      expect(mockRepo.save).toHaveBeenCalled();
      expect(mockCache.delByPattern).toHaveBeenCalledWith(
        `tasks:user:${USER_ID}:list:*`,
      );
      expect(result).toEqual(mockTask);
    });
  });

  // ─── findAll ──────────────────────────────────────────

  describe('findAll', () => {
    const query = { page: 1, limit: 10 };

    it('should return cached result on cache hit', async () => {
      const cached = { data: [mockTask], total: 1, page: 1, limit: 10, totalPages: 1 };
      mockCache.get.mockResolvedValueOnce(cached);

      const result = await service.findAll(USER_ID, query);

      expect(mockCache.get).toHaveBeenCalled();
      expect(result).toEqual(cached);
      expect(mockRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should query DB on cache miss and cache result', async () => {
      mockCache.get.mockResolvedValueOnce(null);

      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockTask], 1]),
      };
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(USER_ID, query);

      expect(result.data).toEqual([mockTask]);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should filter by status when provided', async () => {
      mockCache.get.mockResolvedValueOnce(null);
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(USER_ID, { ...query, status: TaskStatus.DONE });

      expect(qb.andWhere).toHaveBeenCalledWith('task.status = :status', {
        status: TaskStatus.DONE,
      });
    });
  });

  // ─── findOne ──────────────────────────────────────────

  describe('findOne', () => {
    it('should return a task if found', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockTask);
      const result = await service.findOne(USER_ID, TASK_ID);
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne(USER_ID, TASK_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should scope query by userId (ownership)', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockTask);
      await service.findOne(USER_ID, TASK_ID);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: TASK_ID, userId: USER_ID },
      });
    });
  });

  // ─── update ───────────────────────────────────────────

  describe('update', () => {
    it('should update and invalidate cache', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ ...mockTask });
      const updated = { ...mockTask, title: 'Updated' };
      mockRepo.save.mockResolvedValueOnce(updated);

      const result = await service.update(USER_ID, TASK_ID, { title: 'Updated' });

      expect(mockRepo.save).toHaveBeenCalled();
      expect(mockCache.delByPattern).toHaveBeenCalledWith(
        `tasks:user:${USER_ID}:list:*`,
      );
      expect(result.title).toBe('Updated');
    });

    it('should throw NotFoundException if task not found', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      await expect(
        service.update(USER_ID, TASK_ID, { title: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ───────────────────────────────────────────

  describe('remove', () => {
    it('should remove task and invalidate cache', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockTask);

      await service.remove(USER_ID, TASK_ID);

      expect(mockRepo.remove).toHaveBeenCalledWith(mockTask);
      expect(mockCache.delByPattern).toHaveBeenCalledWith(
        `tasks:user:${USER_ID}:list:*`,
      );
    });

    it('should throw NotFoundException if task not found', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.remove(USER_ID, TASK_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
