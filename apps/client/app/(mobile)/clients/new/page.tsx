'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { applicationsApi, branchesApi, fileUrl, imageUrl } from '@/lib/api';
import { money } from '@/lib/format';
import { errorMessage, useToast } from '@/lib/toast';
import type { Application, Branch, DocumentType } from '@/lib/types';
import { ErrorBox, Loading } from '@/components/ui';
import { SignaturePad } from '@/components/signature-pad';
import { MAX_UPLOAD_BYTES, shrinkImage } from '@/lib/image';
import {
  ChevronLeftIcon, UserIcon, CardIcon, PinIcon, CalendarIcon,
  PhoneIcon, MailIcon, FileIcon, CheckIcon, UploadIcon, ShieldIcon, EditIcon,
} from '@/components/icons';

const STEPS = [
  { num: 1, title: 'Personal Details', sub: 'Investor information' },
  { num: 2, title: 'Investment Details', sub: 'Package & payment' },
  { num: 3, title: 'Banking Details', sub: 'Account information' },
  { num: 4, title: 'Nominees', sub: 'Up to 4 nominees' },
  { num: 5, title: 'Documents', sub: 'Upload documents (optional)' },
  { num: 6, title: 'Declaration', sub: 'Terms & conditions' },
  { num: 7, title: 'Signature', sub: 'Verify & collect signatures' },
];

const DOC_LIST: { type: DocumentType; name: string; required: boolean }[] = [
  { type: 'nic_passport', name: 'NIC / Passport Copy', required: false },
  { type: 'proof_of_address', name: 'Proof of Address', required: false },
  { type: 'investor_photograph', name: 'Investor Photograph', required: false },
  { type: 'bank_confirmation', name: 'Bank Confirmation Letter', required: false },
  { type: 'source_of_funds', name: 'Source of Funds Document', required: false },
  { type: 'land_allocation', name: 'Land Allocation Document', required: false },
];

const SIGNATURES: { type: DocumentType; label: string }[] = [
  { type: 'investor_signature', label: 'Investor Signature' },
  { type: 'officer_signature', label: 'Officer Signature' },
];

type NomineeForm = { fullName: string; relationship: string; nicPassport: string; mobileNumber: string; profitPercentage: string };
const emptyNominee = (): NomineeForm => ({ fullName: '', relationship: '', nicPassport: '', mobileNumber: '', profitPercentage: '' });
const MOBILE_RE = /^\+?[0-9 ]{9,15}$/;

export default function NewClientPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewClientWizard />
    </Suspense>
  );
}

function NewClientWizard() {
  const { token } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const resumeId = useSearchParams().get('id');

  const [app, setApp] = useState<Application | null>(null);
  const [hydrating, setHydrating] = useState(!!resumeId);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);

  // Step 1 - Personal Details
  const [investorType, setInvestorType] = useState('individual');
  const [fullName, setFullName] = useState('');
  const [nicPassport, setNicPassport] = useState('');
  const [dob, setDob] = useState('');
  const [nationality, setNationality] = useState('sinhala');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [branchId, setBranchId] = useState('');

  // Step 2 - Investment
  const [assetCategory, setAssetCategory] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [plotSize, setPlotSize] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentType, setPaymentType] = useState('full');
  const [amountPaid, setAmountPaid] = useState('');
  const [programmePeriod, setProgrammePeriod] = useState('');

  // Step 3 - Banking
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accHolder, setAccHolder] = useState('');
  const [accNumber, setAccNumber] = useState('');

  // Step 4 - Nominees
  const [nominees, setNominees] = useState<NomineeForm[]>([emptyNominee()]);

  // Step 5 - Documents
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const pendingUpload = useRef<DocumentType | null>(null);

  // Step 6 - Declaration
  const [declAccepted, setDeclAccepted] = useState(false);

  // Step 7 - OTP & signatures
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [otpBusy, setOtpBusy] = useState(false);
  const [signing, setSigning] = useState<DocumentType | null>(null);

  useEffect(() => {
    if (!token) return;
    branchesApi.getAll(token).then(setBranches).catch(() => {});
  }, [token]);

  // Resume a saved draft
  useEffect(() => {
    if (!token || !resumeId) return;
    applicationsApi.getById(resumeId, token)
      .then((a) => {
        if (a.status !== 'draft' && a.status !== 'rejected') {
          router.replace(`/clients/${a.id}`);
          return;
        }
        hydrate(a);
        setCurrentStep(Math.min(Math.max(a.currentStep || 1, 1), 7));
      })
      .catch((err) => setError(errorMessage(err, 'Could not load application')))
      .finally(() => setHydrating(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, resumeId]);

  const hydrate = (a: Application) => {
    setApp(a);
    setInvestorType(a.investorType);
    setFullName(a.fullName);
    setNicPassport(a.nicPassport);
    setDob(a.dateOfBirth ? String(a.dateOfBirth).slice(0, 10) : '');
    setNationality(a.nationality);
    setMobile(a.mobileNumber);
    setEmail(a.emailAddress || '');
    setAddress(a.residentialAddress || '');
    setOccupation(a.occupation || '');
    setBranchId(a.branch?.id || '');
    if (a.investment) {
      setAssetCategory(a.investment.assetCategory || '');
      setProjectLocation(a.investment.projectLocation || '');
      setPlotSize(a.investment.packagePlotSize || '');
      setTotalAmount(String(Number(a.investment.totalAmount) || ''));
      setPaymentType(a.investment.paymentType);
      setAmountPaid(String(Number(a.investment.amountPaid) || ''));
      setProgrammePeriod(a.investment.programmePeriod || '');
    }
    if (a.bankingDetail) {
      setBankName(a.bankingDetail.bankName || '');
      setBranchName(a.bankingDetail.branchName || '');
      setAccHolder(a.bankingDetail.accountHolderName || '');
      setAccNumber(a.bankingDetail.accountNumber || '');
    }
    if (a.nominees?.length) {
      setNominees(a.nominees.map((n) => ({
        fullName: n.fullName, relationship: n.relationship || '', nicPassport: n.nicPassport || '',
        mobileNumber: n.mobileNumber || '', profitPercentage: String(Number(n.profitPercentage) || ''),
      })));
    }
    setDeclAccepted(a.declarationAccepted);
  };

  const docOf = (type: DocumentType) => app?.documents?.find((d) => d.documentType === type);
  const isUploaded = (type: DocumentType) => docOf(type)?.status === 'uploaded';

  const nomineeShare = nominees.filter(n => n.fullName.trim()).reduce((s, n) => s + (parseFloat(n.profitPercentage) || 0), 0);

  /** Client-side checks so the officer sees problems before the server does. */
  const validate = (): string => {
    switch (currentStep) {
      case 1:
        if (!fullName.trim()) return 'Full name is required';
        if (!nicPassport.trim()) return 'NIC / Passport is required';
        if (!MOBILE_RE.test(mobile.trim())) return 'Enter a valid mobile number';
        if (email && !/^\S+@\S+\.\S+$/.test(email)) return 'Enter a valid email address';
        return '';
      case 2: {
        const total = parseFloat(totalAmount);
        if (!total || total <= 0) return 'Enter the total investment amount';
        if (paymentType === 'part') {
          const paid = parseFloat(amountPaid) || 0;
          if (paid <= 0 || paid > total) return 'Amount paid must be more than 0 and at most the total';
        }
        return '';
      }
      case 4: {
        const filled = nominees.filter(n => n.fullName.trim());
        if (filled.length && Math.abs(nomineeShare - 100) > 0.01) return `Nominee profit shares must add up to 100% (now ${nomineeShare}%)`;
        return '';
      }
      case 5: {
        const missing = DOC_LIST.filter(d => d.required && !isUploaded(d.type)).map(d => d.name);
        return missing.length ? `Upload: ${missing.join(', ')}` : '';
      }
      case 6:
        return declAccepted ? '' : 'Accept the declaration to continue';
      case 7: {
        if (!app?.phoneVerified) return "Verify the client's phone number first";
        const missing = SIGNATURES.filter(s => !isUploaded(s.type)).map(s => s.label);
        return missing.length ? `Capture: ${missing.join(', ')}` : '';
      }
      default:
        return '';
    }
  };

  const handleNext = async () => {
    if (!token) return;
    const problem = validate();
    if (problem) { setError(problem); return; }
    setError('');
    setLoading(true);
    try {
      let updated: Application | null = app;
      const personal = {
        investorType, fullName: fullName.trim(), nicPassport: nicPassport.trim(), dateOfBirth: dob || undefined,
        nationality, mobileNumber: mobile.trim(), emailAddress: email.trim() || undefined,
        residentialAddress: address, occupation, postalSameAsResidential: true, branchId: branchId || undefined,
      };
      if (currentStep === 1) {
        updated = app
          ? await applicationsApi.updatePersonal(app.id, personal, token)
          : await applicationsApi.create(personal, token);
        if (!app && updated) router.replace(`/clients/new?id=${updated.id}`, { scroll: false });
      } else if (!app) {
        throw new Error('Save personal details first');
      } else if (currentStep === 2) {
        updated = await applicationsApi.updateInvestment(app.id, {
          assetCategory, projectLocation, packagePlotSize: plotSize, programmePeriod,
          totalAmount: parseFloat(totalAmount), paymentType,
          amountPaid: paymentType === 'part' ? parseFloat(amountPaid) || 0 : undefined,
        }, token);
      } else if (currentStep === 3) {
        updated = await applicationsApi.updateBanking(app.id, { bankName, branchName, accountHolderName: accHolder, accountNumber: accNumber }, token);
      } else if (currentStep === 4) {
        updated = await applicationsApi.updateNominees(app.id, {
          nominees: nominees.filter(n => n.fullName.trim()).map((n, i) => ({
            ...n, nomineeNumber: i + 1, profitPercentage: parseFloat(n.profitPercentage) || 0,
          })),
        }, token);
      } else if (currentStep === 5) {
        updated = await applicationsApi.updateDocuments(app.id, {
          documents: DOC_LIST.filter(d => !d.required && !isUploaded(d.type)).map(d => ({
            documentType: d.type, documentName: d.name, status: 'pending',
          })),
        }, token);
      } else if (currentStep === 6) {
        updated = await applicationsApi.acceptDeclaration(app.id, token);
      } else if (currentStep === 7) {
        await applicationsApi.submit(app.id, token);
        toast('Application submitted for approval');
        router.push(`/clients/${app.id}`);
        return;
      }
      if (updated) setApp(updated);
      setCurrentStep(s => Math.min(s + 1, 7));
    } catch (err) {
      setError(errorMessage(err, 'Error saving'));
    } finally {
      setLoading(false);
    }
  };

  // ── Documents ──
  const pickFile = (type: DocumentType) => {
    pendingUpload.current = type;
    fileInput.current?.click();
  };

  const upload = async (type: DocumentType, file: Blob, name: string) => {
    if (!token || !app) return;
    setUploadingType(type);
    setError('');
    try {
      setApp(await applicationsApi.uploadDocument(app.id, type, file, name, token));
      toast('Uploaded');
      return true;
    } catch (err) {
      setError(errorMessage(err, 'Upload failed'));
      return false;
    } finally {
      setUploadingType(null);
    }
  };

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    const type = pendingUpload.current;
    e.target.value = '';
    if (!chosen || !type) return;
    const file = await shrinkImage(chosen);
    if (file.size > MAX_UPLOAD_BYTES) { setError('File is larger than 4 MB'); return; }
    await upload(type, file, file.name);
  };

  const removeDoc = async (type: DocumentType) => {
    if (!token || !app) return;
    try {
      setApp(await applicationsApi.removeDocument(app.id, type, token));
    } catch (err) {
      setError(errorMessage(err, 'Could not remove file'));
    }
  };

  // ── OTP ──
  const sendOtp = async () => {
    if (!token || !app) return;
    setOtpBusy(true);
    setError('');
    try {
      const r = await applicationsApi.sendOtp(app.id, token);
      setOtpSent(true);
      setDevCode(r.devCode);
      setOtp(['', '', '', '', '', '']);
      toast(`OTP sent to ${r.sentTo}`);
    } catch (err) {
      setError(errorMessage(err, 'Could not send OTP'));
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyOtp = async (code: string) => {
    if (!token || !app) return;
    setOtpBusy(true);
    setError('');
    try {
      setApp(await applicationsApi.verifyOtp(app.id, code, token));
      setOtpSent(false);
      setDevCode(undefined);
      toast('Phone number verified');
    } catch (err) {
      setError(errorMessage(err, 'Verification failed'));
      setOtp(['', '', '', '', '', '']);
    } finally {
      setOtpBusy(false);
    }
  };

  const updateNominee = (i: number, field: keyof NomineeForm, value: string) => {
    setNominees(prev => prev.map((n, idx) => idx === i ? { ...n, [field]: value } : n));
  };

  const goBack = () => {
    setError('');
    if (currentStep > 1) setCurrentStep(s => s - 1);
    else router.back();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return (
        <div className="field-grid" style={{ rowGap: 13 }}>
          <div className="span-full">
            <label className="field-label">Investor Type</label>
            <div className="segmented">
              {['individual', 'joint', 'company', 'other'].map(t => (
                <button key={t} type="button" className={`seg-btn ${investorType === t ? 'active' : ''}`} onClick={() => setInvestorType(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">Full Name *</label>
            <div className="field-input"><UserIcon /><input placeholder="Enter full name" value={fullName} onChange={e => setFullName(e.target.value)} /></div>
          </div>
          <div>
            <label className="field-label">NIC / Passport *</label>
            <div className="field-input"><CardIcon /><input placeholder="Enter NIC or Passport" value={nicPassport} onChange={e => setNicPassport(e.target.value)} /></div>
          </div>
          <div>
            <label className="field-label">Date of Birth</label>
            <div className="field-input"><CalendarIcon /><input type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={e => setDob(e.target.value)} /></div>
          </div>
          <div>
            <label className="field-label">Nationality</label>
            <div className="segmented">
              <button type="button" className={`seg-btn ${nationality === 'sinhala' ? 'active' : ''}`} onClick={() => setNationality('sinhala')}>Sinhala</button>
              <button type="button" className={`seg-btn ${nationality === 'islam' ? 'active' : ''}`} onClick={() => setNationality('islam')}>Islam</button>
            </div>
          </div>
          <div>
            <label className="field-label">Mobile Number *</label>
            <div className="field-input"><PhoneIcon /><input type="tel" placeholder="+94 7X XXX XXXX" value={mobile} onChange={e => setMobile(e.target.value)} /></div>
          </div>
          <div>
            <label className="field-label">Email Address</label>
            <div className="field-input"><MailIcon /><input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
          </div>
          <div>
            <label className="field-label">Residential Address</label>
            <div className="field-input"><PinIcon /><input placeholder="Enter address" value={address} onChange={e => setAddress(e.target.value)} /></div>
          </div>
          <div>
            <label className="field-label">Occupation</label>
            <div className="field-input"><input placeholder="Enter occupation" value={occupation} onChange={e => setOccupation(e.target.value)} /></div>
          </div>
          <div className="span-full">
            <label className="field-label">Branch</label>
            <div className="field-input">
              <PinIcon />
              <select value={branchId} onChange={e => setBranchId(e.target.value)} disabled={!!app} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'inherit' }}>
                <option value="">Head Office</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      );
      case 2: return (
        <div className="field-grid" style={{ rowGap: 13 }}>
          <div>
            <label className="field-label">Asset Category</label>
            <div className="field-input"><input placeholder="e.g. Land, Property" value={assetCategory} onChange={e => setAssetCategory(e.target.value)} /></div>
          </div>
          <div>
            <label className="field-label">Project Location</label>
            <div className="field-input"><PinIcon /><input placeholder="Select location" value={projectLocation} onChange={e => setProjectLocation(e.target.value)} /></div>
          </div>
          <div>
            <label className="field-label">Package / Plot Size</label>
            <div className="field-input"><input placeholder="e.g. 10 perches" value={plotSize} onChange={e => setPlotSize(e.target.value)} /></div>
          </div>
          <div>
            <label className="field-label">Programme Period</label>
            <div className="field-input"><CalendarIcon /><input placeholder="e.g. 24 months" value={programmePeriod} onChange={e => setProgrammePeriod(e.target.value)} /></div>
          </div>
          <div className="span-full">
            <label className="field-label">Total Investment Amount (Rs.) *</label>
            <div className="field-input"><CardIcon /><input type="number" inputMode="decimal" placeholder="500000" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} /></div>
          </div>
          <div className="span-full">
            <label className="field-label">Payment Type</label>
            <div className="segmented">
              <button type="button" className={`seg-btn ${paymentType === 'full' ? 'active' : ''}`} onClick={() => setPaymentType('full')}>Full Payment</button>
              <button type="button" className={`seg-btn ${paymentType === 'part' ? 'active' : ''}`} onClick={() => setPaymentType('part')}>Part Payment</button>
            </div>
          </div>
          {paymentType === 'part' && (
            <div className="span-full">
              <label className="field-label">Amount Paid (Rs.) *</label>
              <div className="field-input"><CardIcon /><input type="number" inputMode="decimal" placeholder="250000" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} /></div>
              {totalAmount && amountPaid && (
                <div className="info-strip" style={{ marginTop: 10 }}>
                  <span>📋</span>
                  <span>Balance: <strong>{money(parseFloat(totalAmount) - parseFloat(amountPaid))}</strong></span>
                </div>
              )}
            </div>
          )}
        </div>
      );
      case 3: return (
        <div className="field-grid" style={{ rowGap: 13 }}>
          <div>
            <label className="field-label">Bank Name</label>
            <div className="field-input"><input placeholder="e.g. Bank of Ceylon" value={bankName} onChange={e => setBankName(e.target.value)} /></div>
          </div>
          <div>
            <label className="field-label">Branch</label>
            <div className="field-input"><PinIcon /><input placeholder="Branch name" value={branchName} onChange={e => setBranchName(e.target.value)} /></div>
          </div>
          <div>
            <label className="field-label">Account Holder Name</label>
            <div className="field-input"><UserIcon /><input placeholder="Full name" value={accHolder} onChange={e => setAccHolder(e.target.value)} /></div>
          </div>
          <div>
            <label className="field-label">Account Number</label>
            <div className="field-input"><CardIcon /><input inputMode="numeric" placeholder="Enter account number" value={accNumber} onChange={e => setAccNumber(e.target.value)} /></div>
          </div>
        </div>
      );
      case 4: return (
        <div>
          {nominees.map((n, i) => (
            <div key={i} className="nominee-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--green-700)' }}>Nominee {i + 1}</span>
                {nominees.length > 1 && (
                  <button type="button" style={{ fontSize: 11, color: 'var(--red-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }} onClick={() => setNominees(nominees.filter((_, idx) => idx !== i))}>Remove</button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 10 }}>
                <div><label className="field-label">Full Name</label><div className="field-input"><input placeholder="Nominee name" value={n.fullName} onChange={e => updateNominee(i, 'fullName', e.target.value)} /></div></div>
                <div className="field-pair" style={{ gap: 10 }}>
                  <div><label className="field-label">Relationship</label><div className="field-input"><input placeholder="e.g. Spouse" value={n.relationship} onChange={e => updateNominee(i, 'relationship', e.target.value)} /></div></div>
                  <div><label className="field-label">Profit %</label><div className="field-input"><input type="number" inputMode="decimal" placeholder="25" value={n.profitPercentage} onChange={e => updateNominee(i, 'profitPercentage', e.target.value)} /></div></div>
                </div>
                <div className="field-pair" style={{ gap: 10 }}>
                  <div><label className="field-label">NIC / Passport</label><div className="field-input"><input placeholder="NIC number" value={n.nicPassport} onChange={e => updateNominee(i, 'nicPassport', e.target.value)} /></div></div>
                  <div><label className="field-label">Mobile</label><div className="field-input"><input type="tel" placeholder="+94 7X…" value={n.mobileNumber} onChange={e => updateNominee(i, 'mobileNumber', e.target.value)} /></div></div>
                </div>
              </div>
            </div>
          ))}
          <div className="info-strip" style={{ marginBottom: 12 }}>
            <span>📋</span>
            <span>Total profit share: <strong style={{ color: Math.abs(nomineeShare - 100) < 0.01 ? 'var(--green-700)' : 'var(--orange-600)' }}>{nomineeShare}%</strong> of 100%. Leave names empty to skip nominees.</span>
          </div>
          {nominees.length < 4 && (
            <button type="button" className="btn-outline" onClick={() => setNominees([...nominees, emptyNominee()])} style={{ marginTop: 4 }}>+ Add Nominee</button>
          )}
        </div>
      );
      case 5: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DOC_LIST.map(d => {
            const doc = docOf(d.type);
            const up = doc?.status === 'uploaded';
            const busy = uploadingType === d.type;
            return (
              <div key={d.type} className="doc-row">
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: up ? 'rgba(47,210,122,.14)' : 'rgba(255,255,255,.06)', color: up ? 'var(--green-700)' : 'var(--ink-faint)' }}>
                  {up ? <CheckIcon size={16} /> : <FileIcon size={16} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: up ? 'var(--green-700)' : d.required ? 'var(--orange-600)' : 'var(--ink-faint)', fontWeight: 600, marginTop: 2 }}>
                    {up ? (
                      <>Uploaded · <a href={fileUrl(doc?.fileUrl)} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>View</a> · <button type="button" onClick={() => removeDoc(d.type)} style={{ color: 'var(--red-600)', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0 }}>Remove</button></>
                    ) : d.required ? 'Required' : 'Optional'}
                  </div>
                </div>
                <button type="button" className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => pickFile(d.type)} disabled={!!uploadingType} aria-label={`Upload ${d.name}`}>
                  {busy ? <span className="spinner" style={{ width: 14, height: 14, borderColor: 'var(--line)', borderTopColor: 'var(--green-700)' }} /> : <UploadIcon size={15} />}
                </button>
              </div>
            );
          })}
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>JPG, PNG, WEBP, HEIC or PDF · up to 10 MB. On a phone you can take a photo directly.</div>
        </div>
      );
      case 6: return (
        <div>
          <div className="declaration-box">
            <p><strong>DECLARATION</strong></p>
            <p style={{ marginTop: 8 }}>I/We hereby declare that the information provided in this application form is true, correct, and complete to the best of my/our knowledge.</p>
            <p style={{ marginTop: 8 }}>I/We understand that any false statement or misrepresentation of facts may result in the rejection of this application.</p>
            <p style={{ marginTop: 8 }}>I/We agree to abide by the terms and conditions of Prestige Glamour Group (PGG) as outlined in the investment agreement.</p>
            <p style={{ marginTop: 8 }}>I/We confirm that the source of funds used for this investment is legitimate and lawfully obtained.</p>
            <p style={{ marginTop: 8 }}>I/We authorize PGG to verify any information provided in this application with relevant authorities.</p>
          </div>
          <div role="checkbox" aria-checked={declAccepted} tabIndex={0} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}
            onClick={() => setDeclAccepted(!declAccepted)}
            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setDeclAccepted(!declAccepted); } }}>
            <div className={`custom-checkbox ${declAccepted ? 'checked' : ''}`}>
              <CheckIcon size={12} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              I have read and agree to the declaration, terms &amp; conditions of Prestige Glamour Group
            </span>
          </div>
        </div>
      );
      case 7: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Phone verification */}
          {app?.phoneVerified ? (
            <div className="doc-row">
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(47,210,122,.14)', color: 'var(--green-700)' }}><CheckIcon size={16} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Phone Verified</div>
                <div style={{ fontSize: 11, color: 'var(--green-700)', fontWeight: 600 }}>{app.mobileNumber}</div>
              </div>
            </div>
          ) : !otpSent ? (
            <div className="glass-card" style={{ padding: 18, textAlign: 'center' }}>
              <ShieldIcon size={40} />
              <div style={{ fontSize: 15, fontWeight: 800, marginTop: 10 }}>Verification Required</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 6 }}>We need to verify the client&apos;s phone number before final submission.</div>
              <button type="button" className="btn-primary" style={{ marginTop: 16 }} onClick={sendOtp} disabled={otpBusy}>
                {otpBusy ? <span className="spinner" /> : `Send OTP to ${app?.mobileNumber || mobile}`}
              </button>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: 22, textAlign: 'center' }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>📱</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Enter OTP</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 6 }}>Sent to {app?.mobileNumber}</div>
              {devCode && (
                <div className="info-strip" style={{ marginTop: 12, justifyContent: 'center' }}>
                  <span>Test mode (no SMS gateway): code <strong>{devCode}</strong></span>
                </div>
              )}
              <div className="otp-row" style={{ margin: '20px 0' }}>
                {otp.map((digit, i) => (
                  <input key={i} className="otp-box" maxLength={1} inputMode="numeric" value={digit} aria-label={`OTP digit ${i + 1}`} disabled={otpBusy}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d?$/.test(val)) {
                        const newOtp = [...otp]; newOtp[i] = val; setOtp(newOtp);
                        if (val && i < 5) (e.target.nextElementSibling as HTMLInputElement)?.focus();
                        if (newOtp.every(Boolean)) verifyOtp(newOtp.join(''));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otp[i] && i > 0) {
                        (e.currentTarget.previousElementSibling as HTMLInputElement)?.focus();
                      }
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Didn&apos;t receive? <button type="button" onClick={sendOtp} disabled={otpBusy} style={{ color: 'var(--green-700)', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none', font: 'inherit' }}>Resend</button></div>
            </div>
          )}

          {/* Signatures */}
          {SIGNATURES.map(s => {
            const doc = docOf(s.type);
            const up = doc?.status === 'uploaded';
            if (signing === s.type) {
              return (
                <div key={s.type} className="glass-card" style={{ padding: 16 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 10 }}>{s.label}</div>
                  <SignaturePad
                    saving={uploadingType === s.type}
                    onCancel={() => setSigning(null)}
                    onSave={async (png) => { if (await upload(s.type, png, `${s.type}.png`)) setSigning(null); }}
                  />
                </div>
              );
            }
            return (
              <button key={s.type} type="button" className="doc-row" style={{ cursor: 'pointer', textAlign: 'left', width: '100%', font: 'inherit', color: 'inherit' }} onClick={() => setSigning(s.type)}>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(47,210,122,.14)', color: 'var(--green-700)' }}>
                  {up ? <CheckIcon size={16} /> : <EditIcon size={16} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: up ? 'var(--green-700)' : 'var(--ink-faint)', fontWeight: up ? 600 : 400 }}>{up ? 'Captured · tap to redo' : 'Tap to capture'}</div>
                </div>
                {up && doc?.fileUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl(doc.fileUrl, 'h_102')} alt={`${s.label} preview`} style={{ height: 34, borderRadius: 6, background: '#fff' }} />
                )}
              </button>
            );
          })}
        </div>
      );
      default: return null;
    }
  };

  if (hydrating) return <Loading />;

  return (
    <div className="mobile-container" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <input ref={fileInput} type="file" accept="image/*,application/pdf" hidden onChange={onFileChosen} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px 6px' }}>
        <button className="icon-btn" onClick={goBack} aria-label="Back"><ChevronLeftIcon /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800 }}>{app ? app.fullName : 'New Client'}</h1>
          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{app ? `${app.referenceNumber} · ` : ''}Step {currentStep} of 7</div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--green-700)' }}>{Math.round((currentStep / 7) * 100)}%</span>
      </div>

      {/* Progress bar */}
      <div style={{ margin: '8px 20px', height: 5, borderRadius: 5, background: 'var(--line)' }}>
        <div style={{ height: '100%', borderRadius: 5, background: 'var(--acc)', width: `${(currentStep / 7) * 100}%`, transition: 'width .4s cubic-bezier(.22,.61,.36,1)' }} />
      </div>

      {/* Stepper mini */}
      <div style={{ display: 'flex', gap: 3, padding: '6px 20px 0' }}>
        {STEPS.map(s => (
          <div key={s.num} style={{
            flex: 1, height: 3, borderRadius: 3,
            background: s.num <= currentStep ? 'var(--green-700)' : 'var(--line)',
            transition: 'background .3s ease',
          }} />
        ))}
      </div>

      {/* Step title */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>{STEPS[currentStep - 1].title}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{STEPS[currentStep - 1].sub}</div>
      </div>

      {/* Step content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 22px' }}>
        {app?.status === 'rejected' && app.rejectionReason && <ErrorBox>Rejected: {app.rejectionReason}</ErrorBox>}
        <ErrorBox>{error}</ErrorBox>
        {renderStep()}
      </div>

      {/* Bottom buttons */}
      <div style={{ padding: '10px 20px 20px', display: 'flex', gap: 12 }}>
        {currentStep > 1 && (
          <button className="btn-outline" style={{ flex: 0.4 }} onClick={goBack}>Back</button>
        )}
        <button className="btn-primary" style={{ flex: 1 }} onClick={handleNext} disabled={loading || !!uploadingType}>
          {loading ? <span className="spinner" /> : currentStep === 7 ? 'Submit Application' : 'Save & Continue'}
        </button>
      </div>
    </div>
  );
}
