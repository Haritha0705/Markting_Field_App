export type Role = 'superAdmin' | 'admin' | 'agent' | 'customer';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'pending_approval'
  | 'approved'
  | 'rejected';

export type DocumentType =
  | 'nic_passport'
  | 'proof_of_address'
  | 'investor_photograph'
  | 'bank_confirmation'
  | 'source_of_funds'
  | 'land_allocation'
  | 'investor_signature'
  | 'investor_fingerprint'
  | 'joint_witness_signature'
  | 'officer_signature';

export type DocumentStatus = 'pending' | 'uploaded' | 'not_applicable';

export interface SessionUser {
  sub: string;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  dob?: string | null;
  bio?: string | null;
  imgUrl?: string | null;
}

export interface Page<T> {
  content: T[];
  pageNumber: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
}

export interface PersonRef {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/** Decimal columns arrive from Postgres as strings. */
type Money = string | number;

export interface Investment {
  id: string;
  assetCategory?: string;
  projectLocation?: string;
  packagePlotSize?: string;
  propertyNumber?: string;
  propertyPlanNumber?: string;
  totalAmount: Money;
  paymentType: 'full' | 'part';
  amountPaid: Money;
  balanceRemaining: Money;
  programmePeriod?: string;
  payoutMethod?: 'bank_transfer' | 'cash' | 'cheque';
}

export interface BankingDetail {
  bankName?: string;
  branchName?: string;
  accountHolderName?: string;
  accountNumber?: string;
}

export interface Nominee {
  id?: string;
  nomineeNumber: number;
  fullName: string;
  relationship?: string;
  nicPassport?: string;
  mobileNumber?: string;
  profitPercentage?: Money;
}

export interface AppDocument {
  id: string;
  documentType: DocumentType;
  documentName: string;
  status: DocumentStatus;
  fileUrl?: string | null;
  mimeType?: string | null;
  uploadedAt?: string | null;
}

export interface Payment {
  id: string;
  amount: Money;
  paymentDate: string;
  paymentMethod?: string;
  receiptNumber?: string;
  notes?: string;
}

export interface Application {
  id: string;
  referenceNumber: string;
  investorType: 'individual' | 'joint' | 'company' | 'other';
  fullName: string;
  nicPassport: string;
  dateOfBirth?: string | null;
  nationality: 'sinhala' | 'islam';
  residentialAddress?: string;
  mobileNumber: string;
  emailAddress?: string;
  occupation?: string;
  status: ApplicationStatus;
  currentStep: number;
  declarationAccepted: boolean;
  phoneVerified: boolean;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  branch?: Branch | null;
  officer?: PersonRef | null;
  approvedBy?: PersonRef | null;
  investment?: Investment | null;
  bankingDetail?: BankingDetail | null;
  nominees?: Nominee[];
  documents?: AppDocument[];
  payments?: Payment[];
}

export interface ApplicationStats {
  total: number;
  drafts: number;
  pending: number;
  verified: number;
  rejected: number;
  totalInvestment: number;
  totalCollected: number;
}

export interface AdminStats extends ApplicationStats {
  pendingQuotations: number;
  activeOfficers: number;
}

export interface Quotation {
  id: string;
  clientName?: string;
  nationality: 'sinhala' | 'islam';
  investmentAmount: Money;
  ratePercentage?: Money | null;
  periodValue?: number;
  periodUnit?: 'months' | 'years';
  monthlyProfit?: Money | null;
  totalProfit?: Money | null;
  maturityValue?: Money | null;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  createdBy?: PersonRef | null;
}

export interface AppNotification {
  id: string;
  title: string;
  description?: string;
  type: string;
  isRead: boolean;
  referenceId?: string;
  createdAt: string;
}

export interface OfficerOverview {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  territory?: string;
  phone?: string | null;
  dob?: string | null;
  bio?: string | null;
  imgUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  stats: { total: number; verified: number; pending: number; drafts: number };
}
