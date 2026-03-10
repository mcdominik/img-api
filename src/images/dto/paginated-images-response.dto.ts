import { ApiProperty } from '@nestjs/swagger';
import { ImageResponseDto } from './image-response.dto.js';

export class PaginationMeta {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginatedImagesResponseDto {
  @ApiProperty({ type: [ImageResponseDto] })
  data: ImageResponseDto[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;
}
