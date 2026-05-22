import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSpecialtiesTable1779371608674 implements MigrationInterface {
    name = 'CreateSpecialtiesTable1779371608674'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "specialties" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0ecc16d70a3eba636ba693759da" UNIQUE ("code"), CONSTRAINT "PK_ba01cec5aa8ac48778a1d097e98" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7b691a18a1b9928fd96eb9f15b" ON "users" ("lid") `);
        await queryRunner.query(`CREATE INDEX "IDX_4791215654cd9a929d85e7a9c0" ON "demands" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_0d928a742cce160e4c99aaa86c" ON "demands" ("departmentId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_6a3d12ef7fc72cc373a59d1795" ON "demand_history" ("demandId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_6a3d12ef7fc72cc373a59d1795"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0d928a742cce160e4c99aaa86c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4791215654cd9a929d85e7a9c0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7b691a18a1b9928fd96eb9f15b"`);
        await queryRunner.query(`DROP TABLE "specialties"`);
    }

}
