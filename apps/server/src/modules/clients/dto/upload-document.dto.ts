import { IsEnum } from 'class-validator';
import { DocumentType } from '../enums/client.enums';

export class UploadDocumentDto {
  @IsEnum(DocumentType)
  documentType: DocumentType;
}
