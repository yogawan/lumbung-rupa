import prisma from './prisma'
import bcrypt from 'bcryptjs'
import { UserModel, UserRole } from '../models/User'

type DocumentInput = {
  type: 'BUKTI_KEMITRAAN' | 'DOKUMEN_LEGAL' | 'SURAT_PERYATAAN_IP' | 'DOKUMEN_KYC' | 'DOKUMEN_BILLING' | 'DOKUMEN_PAJAK'
  url?: string
}

type CreateUserInput = {
  email: string
  password: string
  fullName?: string
  phone?: string
  role?: UserRole
  companyProfile?: Partial<UserModel['companyProfile']>
  documents?: DocumentInput[]
}

const SALT_ROUNDS = 10

export async function createUser(data: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) {
    throw new Error('Email already in use')
  }

  const hashed = await bcrypt.hash(data.password, SALT_ROUNDS)

  const toCreate: any = {
    email: data.email,
    password: hashed,
    fullName: data.fullName,
    phone: data.phone,
    role: data.role ?? 'LICENSE_BUYER',
    createdAt: new Date(),
  }

  if (data.companyProfile) {
    toCreate.companyName = data.companyProfile.companyName
    toCreate.industry = data.companyProfile.industry
    toCreate.companyAddress = data.companyProfile.companyAddress
    toCreate.companyWebsite = data.companyProfile.companyWebsite
    toCreate.companyRegistrationNumber = data.companyProfile.companyRegistrationNumber
  }

  // map provided document URLs directly onto user fields (no separate Document model)
  if (data.documents && Array.isArray(data.documents) && data.documents.length > 0) {
    for (const d of data.documents) {
      if (d.type === 'BUKTI_KEMITRAAN') toCreate.buktiKemitraan = d.url
      if (d.type === 'DOKUMEN_LEGAL') toCreate.dokumenLegal = d.url
      if (d.type === 'SURAT_PERYATAAN_IP') toCreate.suratPernyataanIp = d.url
      if (d.type === 'DOKUMEN_KYC') toCreate.dokumenKYC = d.url
      if (d.type === 'DOKUMEN_BILLING') toCreate.dokumenBilling = d.url
      if (d.type === 'DOKUMEN_PAJAK') toCreate.dokumenPajak = d.url
    }
  }

  const user = await prisma.user.create({ data: toCreate })
  return user as unknown as UserModel
}

export async function findByEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  return user
}

export async function findById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } })
  return user
}

export async function updateProfile(id: string, updates: Partial<CreateUserInput & { emailVerifiedAt?: Date }>) {
  const data: any = {}
  if (updates.fullName) data.fullName = updates.fullName
  if (updates.phone) data.phone = updates.phone
  if (updates.companyProfile) {
    data.companyName = updates.companyProfile.companyName
    data.industry = updates.companyProfile.industry
    data.companyAddress = updates.companyProfile.companyAddress
    data.companyWebsite = updates.companyProfile.companyWebsite
    data.companyRegistrationNumber = updates.companyProfile.companyRegistrationNumber
  }
  if (updates.emailVerifiedAt) data.emailVerifiedAt = updates.emailVerifiedAt

  // If document URLs provided, set corresponding user URL fields
  if (updates.documents && Array.isArray(updates.documents) && updates.documents.length > 0) {
    for (const d of updates.documents as any) {
      if (d.type === 'BUKTI_KEMITRAAN') data.buktiKemitraan = d.url
      if (d.type === 'DOKUMEN_LEGAL') data.dokumenLegal = d.url
      if (d.type === 'SURAT_PERYATAAN_IP') data.suratPernyataanIp = d.url
      if (d.type === 'DOKUMEN_KYC') data.dokumenKYC = d.url
      if (d.type === 'DOKUMEN_BILLING') data.dokumenBilling = d.url
      if (d.type === 'DOKUMEN_PAJAK') data.dokumenPajak = d.url
    }
  }

  const user = await prisma.user.update({ where: { id }, data })
  return user
}

export async function setRole(id: string, role: UserRole) {
  const user = await prisma.user.update({ where: { id }, data: { role } })
  return user
}

export async function verifyEmail(id: string) {
  const user = await prisma.user.update({ where: { id }, data: { verificationStatus: 'VERIFIED', emailVerifiedAt: new Date() } })
  return user
}

export async function setDocumentUrl(id: string, type: string, url: string) {
  // Map document type to user field
  const map: Record<string, string> = {
    BUKTI_KEMITRAAN: 'buktiKemitraan',
    DOKUMEN_LEGAL: 'dokumenLegal',
    SURAT_PERYATAAN_IP: 'suratPernyataanIp',
    DOKUMEN_KYC: 'dokumenKYC',
    DOKUMEN_BILLING: 'dokumenBilling',
    DOKUMEN_PAJAK: 'dokumenPajak',
  }

  const field = map[type]
  if (!field) throw new Error('Unsupported document type')

  const data: any = {}
  data[field] = url

  const user = await prisma.user.update({ where: { id }, data })
  return user
}

export async function comparePassword(email: string, password: string) {
  const user: any = await prisma.user.findUnique({ where: { email } })
  if (!user) return false
  const ok = await bcrypt.compare(password, user.password)
  return ok ? user : false
}

export default {
  createUser,
  findByEmail,
  findById,
  updateProfile,
  setRole,
  verifyEmail,
  comparePassword,
}
