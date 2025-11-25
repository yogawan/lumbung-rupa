export type UserRole = "CULTURAL_PARTNER" | "LICENSE_BUYER" | "ADMIN";

export interface CompanyProfile {
  companyName?: string;
  industry?: string;
  companyAddress?: string;
  companyWebsite?: string;
  companyRegistrationNumber?: string;
}

export interface DocumentModel {
  id: string;
  userId?: string | null;
  type: 'BUKTI_KEMITRAAN' | 'DOKUMEN_LEGAL' | 'SURAT_PERYATAAN_IP' | 'DOKUMEN_KYC';
  filename?: string | null;
  url?: string | null;
  required?: boolean;
  createdAt?: string
}



export interface UserModel {
  id: string;
  email: string;
  password: string; // hashed
  fullName?: string;
  phone?: string;
  role: UserRole;
  companyProfile?: CompanyProfile;
  documents?: DocumentModel[] | null;
  verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED";
  emailVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}
