import { ApiProperty } from '@nestjs/swagger';

export class ImageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  width: number;

  @ApiProperty()
  height: number;
}
