import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

/**
 * E2E tests – require running PostgreSQL and Redis.
 * Run: docker compose up -d postgres redis && pnpm test:e2e
 */
describe('API Tasks (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let taskId: string;

  const testEmail = `e2e-${Date.now()}@test.com`;
  const testPassword = 'Test1234!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  // ─── Health ───────────────────────────────────────────

  it('GET /api/health → 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('up');
    expect(res.body.redis).toBe('up');
  });

  // ─── Auth ─────────────────────────────────────────────

  it('POST /api/auth/register → 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.tokenType).toBe('Bearer');
    token = res.body.accessToken;
  });

  it('POST /api/auth/register duplicate → 409', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword })
      .expect(409);
  });

  it('POST /api/auth/login → 200', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    token = res.body.accessToken;
  });

  it('POST /api/auth/login wrong password → 401', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'WrongPass1!' })
      .expect(401);
  });

  it('GET /api/auth/me → 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.email).toBe(testEmail);
  });

  it('GET /api/auth/me without token → 401', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  // ─── Tasks CRUD ───────────────────────────────────────

  it('POST /api/tasks → 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'E2E task' })
      .expect(201);

    expect(res.body.title).toBe('E2E task');
    expect(res.body.status).toBe('pending');
    taskId = res.body.id;
  });

  it('GET /api/tasks → 200 (paginated)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/tasks?status=done → filters correctly', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/tasks?status=done')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.every((t: any) => t.status === 'done')).toBe(true);
  });

  it('GET /api/tasks/:id → 200', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.id).toBe(taskId);
  });

  it('PATCH /api/tasks/:id → 200', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done', title: 'Updated E2E' })
      .expect(200);

    expect(res.body.status).toBe('done');
    expect(res.body.title).toBe('Updated E2E');
  });

  it('DELETE /api/tasks/:id → 204', async () => {
    await request(app.getHttpServer())
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  it('GET /api/tasks/:id after delete → 404', async () => {
    await request(app.getHttpServer())
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('POST /api/tasks without auth → 401', async () => {
    await request(app.getHttpServer())
      .post('/api/tasks')
      .send({ title: 'No auth' })
      .expect(401);
  });

  // ─── Validation ───────────────────────────────────────

  it('POST /api/tasks with empty title → 400', async () => {
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '' })
      .expect(400);
  });

  it('POST /api/auth/register with invalid email → 400', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'not-email', password: 'short' })
      .expect(400);
  });
});
