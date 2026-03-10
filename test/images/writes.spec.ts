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
        url: expect.any(String), // eslint-disable-line
        id: expect.any(String), // eslint-disable-line
        width: expect.any(Number), // eslint-disable-line
        height: expect.any(Number), // eslint-disable-line
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

    it('returns 422 when file exceeds 10 MB', async () => {
      const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024);

      const response = await request(bootstrap.app.getHttpServer())
        .post('/images')
        .field('title', 'Too Large')
        .attach('file', oversizedBuffer, {
          filename: 'big.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('resizes image to given width and height', async () => {
      const response = await request(bootstrap.app.getHttpServer())
        .post('/images')
        .field('title', 'Resized')
        .field('width', '50')
        .field('height', '50')
        .attach('file', bootstrap.utils.testImageBuffer, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body.width).toBe(50); // eslint-disable-line
      expect(response.body.height).toBe(50); // eslint-disable-line
    });

    it('preserves aspect ratio when only width is provided', async () => {
      const response = await request(bootstrap.app.getHttpServer())
        .post('/images')
        .field('title', 'Width Only')
        .field('width', '50')
        .attach('file', bootstrap.utils.testImageBuffer, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body.width).toBeLessThanOrEqual(50); // eslint-disable-line
      expect(response.body.height).toBeLessThanOrEqual(100); // eslint-disable-line
    });

    it('uses original dimensions when width and height are omitted', async () => {
      const response = await request(bootstrap.app.getHttpServer())
        .post('/images')
        .field('title', 'Original Size')
        .attach('file', bootstrap.utils.testImageBuffer, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body.width).toBe(100); // eslint-disable-line
      expect(response.body.height).toBe(100); // eslint-disable-line
    });
  });
});
