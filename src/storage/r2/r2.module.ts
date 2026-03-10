import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { R2Service } from './r2.service.js';
import { R2_CLIENT } from './r2.constants.js';

@Module({
  providers: [
    {
      provide: R2_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): S3Client =>
        new S3Client({
          region: 'us-east-1',
          endpoint: config.getOrThrow('R2_ENDPOINT'),
          forcePathStyle: true,
          credentials: {
            accessKeyId: config.getOrThrow('R2_ACCESS_KEY_ID'),
            secretAccessKey: config.getOrThrow('R2_SECRET_ACCESS_KEY'),
          },
        }),
    },
    R2Service,
  ],
  exports: [R2Service],
})
export class R2Module {}
