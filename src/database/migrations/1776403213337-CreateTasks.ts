import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTasks1776403213337 implements MigrationInterface {
    name = 'CreateTasks1776403213337'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tasks_status_enum" AS ENUM('pending', 'in_progress', 'done')`);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(160) NOT NULL, "description" text, "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'pending', "userId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_tasks_user_id" ON "tasks" ("userId") `);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_166bd96559cb38595d392f75a35" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_166bd96559cb38595d392f75a35"`);
        await queryRunner.query(`DROP INDEX "public"."idx_tasks_user_id"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
    }

}
