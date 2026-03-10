import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service.js';
import { UploadImageDto } from './dto/upload-image.dto.js';
import { GetImagesQueryDto } from './dto/get-images-query.dto.js';
import { ImageResponseDto } from './dto/image-response.dto.js';
import { PaginatedImagesResponseDto } from './dto/paginated-images-response.dto.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = /^image\/(jpeg|png|webp|gif)$/;

@ApiTags('images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @ApiOperation({ summary: 'Upload an image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'title'],
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        maxFileSize: { type: 'integer', minimum: 1 },
      },
    },
  })
  @ApiResponse({ status: 201, type: ImageResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 413, description: 'File too large' })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({
            fileType: ALLOWED_IMAGE_TYPES,
            fallbackToMimetype: true,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadImageDto,
  ): Promise<ImageResponseDto> {
    return this.imagesService.upload(file, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List images with optional filtering and pagination',
  })
  @ApiResponse({ status: 200, type: PaginatedImagesResponseDto })
  async findAll(
    @Query() query: GetImagesQueryDto,
  ): Promise<PaginatedImagesResponseDto> {
    return this.imagesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single image by ID' })
  @ApiResponse({ status: 200, type: ImageResponseDto })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ImageResponseDto> {
    return this.imagesService.findOne(id);
  }
}
