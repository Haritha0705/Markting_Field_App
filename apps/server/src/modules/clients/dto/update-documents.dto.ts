import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType, DocumentStatus } from '../enums/client.enums';

export class DocumentItemDto {
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  documentName: string;

  @IsEnum(DocumentStatus)
  status: DocumentStatus;

  @IsString()
  @IsOptional()
  fileUrl?: string;
}

export class UpdateDocumentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentItemDto)
  documents: DocumentItemDto[];
}
