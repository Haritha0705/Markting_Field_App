import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateUserTables1710000000000 implements MigrationInterface {
  name = 'CreateUserTables1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'password_hash',
            type: 'varchar',
          },
          {
            name: 'first_name',
            type: 'varchar',
          },
          {
            name: 'last_name',
            type: 'varchar',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['superAdmin', 'admin', 'agent', 'customer'],
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'profiles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'birth_day', type: 'varchar', isNullable: true },
          { name: 'img_url', type: 'varchar', isNullable: true },
          { name: 'bio', type: 'varchar', isNullable: true },
          { name: 'phone', type: 'varchar', isNullable: true },
          { name: 'userId', type: 'uuid', isUnique: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );
    await queryRunner.createForeignKey(
      'profiles',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await this.createUserRoleTable(queryRunner, 'admins', 'department');
    await this.createUserRoleTable(queryRunner, 'agents', 'territory');
    await this.createUserRoleTable(queryRunner, 'customers', 'customer_type');

    await this.createRoleProfileTable(
      queryRunner,
      'admin_profiles',
      'adminId',
      [{ name: 'office_location', type: 'varchar', isNullable: true }],
      'admins',
    );
    await this.createRoleProfileTable(
      queryRunner,
      'agent_profiles',
      'agentId',
      [{ name: 'years_of_experience', type: 'integer', default: 0 }],
      'agents',
    );
    await this.createRoleProfileTable(
      queryRunner,
      'customer_profiles',
      'customerId',
      [{ name: 'shipping_address', type: 'varchar', isNullable: true }],
      'customers',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('customer_profiles');
    await queryRunner.dropTable('agent_profiles');
    await queryRunner.dropTable('admin_profiles');
    await queryRunner.dropTable('customers');
    await queryRunner.dropTable('agents');
    await queryRunner.dropTable('admins');
    await queryRunner.dropTable('profiles');
    await queryRunner.dropTable('users');
  }

  private async createUserRoleTable(
    queryRunner: QueryRunner,
    name: string,
    detailColumn: string,
  ): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name,
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: detailColumn, type: 'varchar', isNullable: true },
          { name: 'user_id', type: 'uuid' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );
    await queryRunner.createForeignKey(
      name,
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  private async createRoleProfileTable(
    queryRunner: QueryRunner,
    name: string,
    relationColumn: string,
    extraColumns: Array<{
      name: string;
      type: string;
      isNullable?: boolean;
      default?: string | number;
    }>,
    referencedTableName: string,
  ): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name,
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'birth_day', type: 'varchar' },
          { name: 'img_url', type: 'varchar' },
          { name: 'bio', type: 'varchar', isNullable: true },
          { name: relationColumn, type: 'uuid', isUnique: true },
          ...extraColumns,
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );
    await queryRunner.createForeignKey(
      name,
      new TableForeignKey({
        columnNames: [relationColumn],
        referencedTableName,
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }
}
