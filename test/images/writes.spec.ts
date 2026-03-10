import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/bootstrap';

describe('Images - writes', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  describe('POST /images', () => {
    it('uploads an image and returns 201 with response dto', async () => {
      const response = await request(bootstrap.app.getHttpServer())
        .post('/images')
        .field('title', 'Test Upload')
        .attach('file', bootstrap.utils.testImageBuffer, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toMatchObject({
        title: 'Test Upload',
        url: expect.any(String),
        id: expect.any(String),
        width: expect.any(Number),
        height: expect.any(Number),
      });
    });

    it('persists the uploaded image to the database', async () => {
      await request(bootstrap.app.getHttpServer())
        .post('/images')
        .field('title', 'Persisted Image')
        .attach('file', bootstrap.utils.testImageBuffer, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      const images = await bootstrap.models.imageRepository.find();
      expect(images).toHaveLength(1);
      expect(images[0].title).toBe('Persisted Image');
    });

    it('delegates file storage to R2 service with correct arguments', async () => {
      await request(bootstrap.app.getHttpServer())
        .post('/images')
        .field('title', 'R2 Upload')
        .attach('file', bootstrap.utils.testImageBuffer, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(bootstrap.mocks.r2Service.upload).toHaveBeenCalledTimes(1);
      expect(bootstrap.mocks.r2Service.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^images\/.+\.webp$/),
        expect.any(Buffer),
        'image/webp',
      );
    });

    it('returns 400 when title is missing', async () => {
      const response = await request(bootstrap.app.getHttpServer())
        .post('/images')
        .attach('file', bootstrap.utils.testImageBuffer, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('returns error when no file is provided', async () => {
      const response = await request(bootstrap.app.getHttpServer())
        .post('/images')
        .field('title', 'No File');

      expect(response.status).toBeGreaterThanOrEqual(HttpStatus.BAD_REQUEST);
      expect(response.status).toBeLessThan(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('returns 422 when file type is not an image', async () => {
      const response = await request(bootstrap.app.getHttpServer())
        .post('/images')
        .field('title', 'Invalid Type')
        .attach('file', Buffer.from('not an image'), {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });
});
