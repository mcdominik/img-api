import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataType, newDb } from 'pg-mem';
import { randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { ImagesController } from '../../src/images/images.controller';
import { ImagesService } from '../../src/images/images.service';
import { ImageEntity } from '../../src/images/entities/image.entity';
import { R2Service } from '../../src/storage/r2/r2.service';
import sharp from 'sharp';

export const createTestApp = async () => {
  const db = newDb();
  db.public.registerFunction({
    name: 'uuid_generate_v4',
    returns: DataType.text,
    impure: true,
    implementation: () => randomUUID(),
  });

  db.public.registerFunction({
    name: 'version',
    returns: DataType.text,
    implementation: () => 'PostgreSQL 14.0 on x86_64-pc-linux-gnu',
  });

  db.public.registerFunction({
    name: 'current_database',
    returns: DataType.text,
    implementation: () => 'test',
  });

  const dataSource = db.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: [ImageEntity],
    synchronize: true,
  }) as DataSource;
  await dataSource.initialize();

  const r2ServiceMock = {
    upload: jest
      .fn()
      .mockResolvedValue('https://cdn.example.com/images/test.webp'),
  };

  const moduleFixture: TestingModule = await Test.createTestingModule({
    controllers: [ImagesController],
    providers: [
      ImagesService,
      {
        provide: getRepositoryToken(ImageEntity),
        useValue: dataSource.getRepository(ImageEntity),
      },
      {
        provide: R2Service,
        useValue: r2ServiceMock,
      },
    ],
  }).compile();

  const app: INestApplication = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.init();

  const imageRepository: Repository<ImageEntity> =
    dataSource.getRepository(ImageEntity);

  const createImageFixture = (
    overrides: Partial<ImageEntity> = {},
  ): Partial<ImageEntity> => {
    return {
      title: 'Default Image',
      url: 'https://cdn.example.com/images/test.webp',
      width: 100,
      height: 100,
      ...overrides,
    };
  };

  const createTestImageBuffer = async (): Promise<Buffer> => {
    return sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .jpeg()
      .toBuffer();
  };

  return {
    app,
    module: moduleFixture,
    models: { imageRepository },
    mocks: { r2Service: r2ServiceMock },
    methods: {
      clearDatabase: async (): Promise<void> => {
        await imageRepository.clear();
      },
      beforeEach: async (): Promise<void> => {
        await imageRepository.clear();
        jest.clearAllMocks();
      },
      afterAll: async (): Promise<void> => {
        await app.close();
        await dataSource.destroy();
      },
    },
    utils: {
      createImageFixture,
      testImageBuffer: await createTestImageBuffer(),
    },
  };
};
