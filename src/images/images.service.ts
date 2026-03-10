import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { ImageEntity } from './entities/image.entity.js';
import { R2Service } from '../storage/r2/r2.service.js';
import { UploadImageDto } from './dto/upload-image.dto.js';
import { GetImagesQueryDto } from './dto/get-images-query.dto.js';
import { ImageResponseDto } from './dto/image-response.dto.js';
import { PaginatedImagesResponseDto } from './dto/paginated-images-response.dto.js';

const DEFAULT_SHARP_QUALITY = 85;

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(ImageEntity)
    private readonly imageRepository: Repository<ImageEntity>,
    private readonly r2Service: R2Service,
  ) {}

  async upload(
    file: Express.Multer.File,
    dto: UploadImageDto,
  ): Promise<ImageResponseDto> {
    const id = randomUUID();
    const storageKey = `images/${id}.webp`;
    const processed = await this.processImage(
      file.buffer,
      dto.width,
      dto.height,
    );

    const url = await this.r2Service.upload(
      storageKey,
      processed.buffer,
      'image/webp',
    );

    const image = this.imageRepository.create({
      id,
      title: dto.title,
      url,
      width: processed.width,
      height: processed.height,
    });

    const saved = await this.imageRepository.save(image);
    return this.toResponseDto(saved);
  }

  async findAll(query: GetImagesQueryDto): Promise<PaginatedImagesResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = query.title ? { title: ILike(`%${query.title}%`) } : {};

    const [images, total] = await this.imageRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: images.map((image) => this.toResponseDto(image)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ImageResponseDto> {
    const image = await this.imageRepository.findOne({ where: { id } });

    if (!image) {
      throw new NotFoundException(`Image with id "${id}" not found`);
    }

    return this.toResponseDto(image);
  }

  private async processImage(
    buffer: Buffer,
    width?: number,
    height?: number,
  ): Promise<{ buffer: Buffer; width: number; height: number }> {
    try {
      const metadata = await sharp(buffer).metadata();
      if (!metadata.width || !metadata.height) {
        throw new BadRequestException('Unable to read image dimensions.');
      }

      const targetWidth = width ?? metadata.width;
      const targetHeight = height ?? metadata.height;

      const { data, info } = await this.encodeToWebp(
        buffer,
        targetWidth,
        targetHeight,
        DEFAULT_SHARP_QUALITY,
      );
      return { buffer: data, width: info.width, height: info.height };
    } catch {
      throw new BadRequestException('Failed to process image.');
    }
  }

  private async encodeToWebp(
    buffer: Buffer,
    width: number,
    height: number,
    quality: number,
  ): Promise<{ data: Buffer; info: sharp.OutputInfo }> {
    return sharp(buffer)
      .resize(width, height, { fit: 'inside' })
      .webp({ quality })
      .toBuffer({ resolveWithObject: true });
  }

  private toResponseDto(image: ImageEntity): ImageResponseDto {
    return {
      id: image.id,
      title: image.title,
      url: image.url,
      width: image.width,
      height: image.height,
    };
  }
}
