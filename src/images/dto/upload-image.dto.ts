import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UploadImageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Target maximum file size in bytes' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxFileSize?: number;
}
