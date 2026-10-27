export enum InvestorType {
  INDIVIDUAL = 'individual',
  JOINT = 'joint',
  COMPANY = 'company',
  OTHER = 'other',
}

export enum Nationality {
  SINHALA = 'sinhala',
  ISLAM = 'islam',
}

export enum ApplicationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum PaymentType {
  FULL = 'full',
  PART = 'part',
}

export enum PayoutMethod {
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CHEQUE = 'cheque',
}

export enum DocumentType {
  NIC_PASSPORT = 'nic_passport',
  PROOF_OF_ADDRESS = 'proof_of_address',
  INVESTOR_PHOTOGRAPH = 'investor_photograph',
  BANK_CONFIRMATION = 'bank_confirmation',
  SOURCE_OF_FUNDS = 'source_of_funds',
  LAND_ALLOCATION = 'land_allocation',
  INVESTOR_SIGNATURE = 'investor_signature',
  INVESTOR_FINGERPRINT = 'investor_fingerprint',
  JOINT_WITNESS_SIGNATURE = 'joint_witness_signature',
  OFFICER_SIGNATURE = 'officer_signature',
}

export enum DocumentStatus {
  PENDING = 'pending',
  UPLOADED = 'uploaded',
  NOT_APPLICABLE = 'not_applicable',
}

export enum QuotationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum NotificationType {
  CLIENT_VERIFIED = 'client_verified',
  UPCOMING_CLAIM = 'upcoming_claim',
  DOCUMENT_UPLOADED = 'document_uploaded',
  PAYMENT_RECEIVED = 'payment_received',
  SYSTEM_UPDATE = 'system_update',
  APPLICATION_APPROVED = 'application_approved',
  APPLICATION_REJECTED = 'application_rejected',
  QUOTATION_APPROVED = 'quotation_approved',
  QUOTATION_REJECTED = 'quotation_rejected',
}

export enum ApplicationStep {
  PERSONAL = 1,
  INVESTMENT = 2,
  BANKING = 3,
  NOMINEE = 4,
  DOCUMENTS = 5,
  DECLARATION = 6,
  SIGNATURE = 7,
}
