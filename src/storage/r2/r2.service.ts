import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { R2_CLIENT } from './r2.constants.js';

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(
    @Inject(R2_CLIENT) private readonly r2Client: S3Client,
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.getOrThrow('R2_BUCKET_NAME');
    this.publicUrl = this.configService.getOrThrow('R2_PUBLIC_URL');
  }

  async upload(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.r2Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    this.logger.log(`Uploaded file: ${key}`);
    return this.getPublicUrl(key);
  }

  private getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
