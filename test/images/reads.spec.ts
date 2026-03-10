import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { ImageResponseDto } from '../../src/images/dto/image-response.dto';
import { PaginatedImagesResponseDto } from '../../src/images/dto/paginated-images-response.dto';

describe('Images - reads', () => {
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

  describe('GET /images', () => {
    it('returns empty list when no images exist', async () => {
      const response = await request(bootstrap.app.getHttpServer()).get(
        '/images',
      );
      const body = response.body as PaginatedImagesResponseDto;

      expect(response.status).toBe(HttpStatus.OK);
      expect(body.data).toEqual([]);
      expect(body.meta.total).toBe(0);
    });

    it('returns all images with correct structure', async () => {
      await bootstrap.models.imageRepository.save(
        bootstrap.utils.createImageFixture({ title: 'Image A' }),
      );
      await bootstrap.models.imageRepository.save(
        bootstrap.utils.createImageFixture({ title: 'Image B' }),
      );

      const response = await request(bootstrap.app.getHttpServer()).get(
        '/images',
      );
      const body = response.body as PaginatedImagesResponseDto;

      expect(response.status).toBe(HttpStatus.OK);
      expect(body.data).toHaveLength(2);
      expect(body.meta).toEqual({
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('filters images by title (case-insensitive)', async () => {
      await bootstrap.models.imageRepository.save(
        bootstrap.utils.createImageFixture({ title: 'Mountain View' }),
      );
      await bootstrap.models.imageRepository.save(
        bootstrap.utils.createImageFixture({ title: 'Ocean Sunset' }),
      );

      const response = await request(bootstrap.app.getHttpServer()).get(
        '/images?title=mountain',
      );
      const body = response.body as PaginatedImagesResponseDto;

      expect(response.status).toBe(HttpStatus.OK);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe('Mountain View');
    });

    it('returns correct pagination meta', async () => {
      await bootstrap.models.imageRepository.save(
        bootstrap.utils.createImageFixture({ title: 'Image 1' }),
      );
      await bootstrap.models.imageRepository.save(
        bootstrap.utils.createImageFixture({ title: 'Image 2' }),
      );
      await bootstrap.models.imageRepository.save(
        bootstrap.utils.createImageFixture({ title: 'Image 3' }),
      );

      const response = await request(bootstrap.app.getHttpServer()).get(
        '/images?page=1&limit=2',
      );
      const body = response.body as PaginatedImagesResponseDto;

      expect(response.status).toBe(HttpStatus.OK);
      expect(body.data).toHaveLength(2);
      expect(body.meta).toEqual({
        total: 3,
        page: 1,
        limit: 2,
        totalPages: 2,
      });
    });
  });

  describe('GET /images/:id', () => {
    it('returns the image when found', async () => {
      const image = await bootstrap.models.imageRepository.save(
        bootstrap.utils.createImageFixture({ title: 'Test Image' }),
      );

      const response = await request(bootstrap.app.getHttpServer()).get(
        `/images/${image.id}`,
      );

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body as ImageResponseDto).toMatchObject({
        id: image.id,
        title: 'Test Image',
        url: image.url,
        width: image.width,
        height: image.height,
      });
    });

    it('returns 404 when image does not exist', async () => {
      const response = await request(bootstrap.app.getHttpServer()).get(
        '/images/00000000-0000-0000-0000-000000000000',
      );

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('returns 400 for invalid UUID', async () => {
      const response = await request(bootstrap.app.getHttpServer()).get(
        '/images/not-a-uuid',
      );

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });
});
