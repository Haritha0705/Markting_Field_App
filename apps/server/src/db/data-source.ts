import { DataSourceOptions } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const dataSourceOptions: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  useFactory: buildDataSourceOptions,
  inject: [ConfigService],
};

export function buildDataSourceOptions(
  configService: ConfigService,
): DataSourceOptions {
  const url = configService.get<string>('DATABASE_URL');

  return {
    type: 'postgres',
    ...(url && { url, ssl: true }),
    host: configService.get<string>('MASTER_DATABASE_HOST'),
    port: configService.get<number>('MASTER_DATABASE_PORT'),
    username: configService.get<string>('MASTER_DATABASE_USERNAME'),
    password: configService.get<string>('MASTER_DATABASE_PASSWORD'),
    database: configService.get<string>('MASTER_DATABASE_NAME'),
    synchronize: true,
    migrationsRun: true,
    logging: false,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [
      __dirname + '/../migrations/*.ts',
      __dirname + '/../migrations/*.js',
    ],
    extra: {
      max: 200,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 30000,
      statement_timeout: 15000,
      min: 2,
    },
  };
}
