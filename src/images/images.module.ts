import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagesController } from './images.controller.js';
import { ImagesService } from './images.service.js';
import { ImageEntity } from './entities/image.entity.js';
import { R2Module } from '../storage/r2/r2.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([ImageEntity]), R2Module],
  controllers: [ImagesController],
  providers: [ImagesService],
})
export class ImagesModule {}
