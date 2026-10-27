import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { randomUUID } from 'crypto';
import { unlink } from 'fs/promises';
import { basename, join } from 'path';
import { UPLOAD_ROOT } from '../constants';

/** A file held in memory by multer (memoryStorage). */
export interface UploadedBuffer {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface StoredFile {
  url: string;
  size: number;
  mimeType: string;
}

/** Stores uploaded documents, signatures and profile photos on Cloudinary. */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly folder: string;
  private readonly configured: boolean;

  constructor(config: ConfigService) {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET');
    this.configured = !!(cloudName && apiKey && apiSecret);
    if (!this.configured) {
      this.logger.warn(
        'CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET not set: uploads are disabled',
      );
    }
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    this.folder = config.get<string>('CLOUDINARY_FOLDER') || 'pgg-field-app';
  }

  /** Uploads to `<folder>/<subfolder>` and returns the HTTPS delivery URL. */
  async upload(file: UploadedBuffer, subfolder: string): Promise<StoredFile> {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'File storage is not configured. Contact the administrator.',
      );
    }
    const isPdf = file.mimetype === 'application/pdf';
    const isHeic = /^image\/hei[cf]$/.test(file.mimetype);
    const id = randomUUID();

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `${this.folder}/${subfolder}`,
            // PDFs go up as raw files: accounts block PDF delivery as images by default
            resource_type: isPdf ? 'raw' : 'image',
            public_id: isPdf ? `${id}.pdf` : id,
            // Browsers can't show HEIC, so store iPhone photos as JPG
            ...(isHeic ? { format: 'jpg' } : {}),
            overwrite: false,
          },
          (err, res) => (err || !res ? reject(err) : resolve(res)),
        )
        .end(file.buffer);
    }).catch((err) => {
      this.logger.error(`Cloudinary upload failed: ${err?.message ?? err}`);
      throw new InternalServerErrorException('File upload failed, try again');
    });

    return {
      url: result.secure_url,
      size: result.bytes ?? file.size,
      mimeType: isHeic ? 'image/jpeg' : file.mimetype,
    };
  }

  /** Deletes a stored file; never throws, so a cleanup failure can't break a request. */
  async remove(fileUrl?: string | null): Promise<void> {
    if (!fileUrl) return;
    // Files saved before the Cloudinary switch live in the local upload folder
    if (fileUrl.startsWith('/uploads/')) {
      await unlink(join(UPLOAD_ROOT, basename(fileUrl))).catch(() => undefined);
      return;
    }
    const asset = this.parseUrl(fileUrl);
    if (!asset) return;
    await cloudinary.uploader
      .destroy(asset.publicId, {
        resource_type: asset.resourceType,
        invalidate: true,
      })
      .catch((err) =>
        this.logger.warn(
          `Cloudinary delete failed for ${asset.publicId}: ${err?.message ?? err}`,
        ),
      );
  }

  /** res.cloudinary.com/<cloud>/<type>/upload/[v123/]<public_id>[.ext] → public id + type */
  private parseUrl(
    url: string,
  ): { publicId: string; resourceType: 'image' | 'raw' } | null {
    const m =
      /res\.cloudinary\.com\/[^/]+\/(image|raw)\/upload\/(?:v\d+\/)?(.+)$/.exec(
        url,
      );
    if (!m) return null;
    const resourceType = m[1] as 'image' | 'raw';
    const path = decodeURIComponent(m[2]);
    // Raw public ids keep their extension; image ids don't
    return {
      resourceType,
      publicId: resourceType === 'raw' ? path : path.replace(/\.[^./]+$/, ''),
    };
  }
}
