'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { imageUrl, officersApi } from '@/lib/api';
import { getInitials } from '@/lib/format';
import { errorMessage, useToast } from '@/lib/toast';
import type { OfficerOverview } from '@/lib/types';
import { EmptyState, ErrorBox, Loading } from '@/components/ui';
import { SearchIcon, CheckCircleIcon, UserIcon, MailIcon, LockIcon, PinIcon, PhoneIcon, CalendarIcon } from '@/components/icons';

const emptyForm = { firstName: '', lastName: '', email: '', password: '', territory: '' };
const emptyEdit = { firstName: '', lastName: '', email: '', phone: '', territory: '', dob: '', bio: '' };

export default function AdminOfficersPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [officers, setOfficers] = useState<OfficerOverview[] | null>(null);
  const [error, setError] = useState('');

  // Add officer
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Per-card actions
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Edit officer
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState(emptyEdit);
  const [editError, setEditError] = useState('');

  const load = useCallback((term: string) => {
    if (!token) return;
    officersApi.overview(term, token)
      .then((o) => { setOfficers(o); setError(''); })
      .catch((err) => { setOfficers([]); setError(errorMessage(err, 'Could not load officers')); });
  }, [token]);

  useEffect(() => {
    const t = setTimeout(() => load(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const addOfficer = async () => {
    if (!token) return;
    if (!form.firstName.trim() || !form.lastName.trim()) { setFormError('First and last name are required'); return; }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) { setFormError('Enter a valid email address'); return; }
    if (form.password.length < 8) { setFormError('Password must be at least 8 characters'); return; }
    setSaving(true);
    setFormError('');
    try {
      await officersApi.create({ ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim() }, token);
      toast(`Officer ${form.firstName} added. Share the login details with them.`);
      setForm(emptyForm);
      setShowAdd(false);
      load(search.trim());
    } catch (err) {
      setFormError(errorMessage(err, 'Could not add officer'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (o: OfficerOverview) => {
    if (!token) return;
    setBusyId(o.id);
    try {
      await officersApi.setStatus(o.id, !o.isActive, token);
      setOfficers((prev) => prev?.map((x) => (x.id === o.id ? { ...x, isActive: !o.isActive } : x)) ?? null);
      toast(o.isActive ? `${o.firstName} deactivated` : `${o.firstName} activated`);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const resetPassword = async (o: OfficerOverview) => {
    if (!token) return;
    if (newPassword.length < 8) { toast('Password must be at least 8 characters', 'error'); return; }
    setBusyId(o.id);
    try {
      await officersApi.resetPassword(o.id, newPassword, token);
      toast(`Password reset for ${o.firstName}`);
      setResetId(null);
      setNewPassword('');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (o: OfficerOverview) => {
    setEdit({
      firstName: o.firstName, lastName: o.lastName, email: o.email, phone: o.phone || '',
      territory: o.territory || '', dob: o.dob?.slice(0, 10) || '', bio: o.bio || '',
    });
    setEditError('');
    setResetId(null);
    setEditId(o.id);
  };

  const saveEdit = async (o: OfficerOverview) => {
    if (!token) return;
    if (!edit.firstName.trim() || !edit.lastName.trim()) { setEditError('First and last name are required'); return; }
    if (!/^\S+@\S+\.\S+$/.test(edit.email.trim())) { setEditError('Enter a valid email address'); return; }
    if (edit.phone.trim() && !/^\+?[0-9 ]{7,20}$/.test(edit.phone.trim())) { setEditError('Enter a valid phone number'); return; }
    setBusyId(o.id);
    setEditError('');
    try {
      await officersApi.update(o.id, {
        firstName: edit.firstName.trim(),
        lastName: edit.lastName.trim(),
        email: edit.email.trim(),
        territory: edit.territory.trim(),
        phone: edit.phone.trim() || null,
        dob: edit.dob || null,
        bio: edit.bio.trim() || null,
      }, token);
      toast(`${edit.firstName.trim()}'s details updated`);
      setEditId(null);
      load(search.trim());
    } catch (err) {
      setEditError(errorMessage(err, 'Could not update officer'));
    } finally {
      setBusyId(null);
    }
  };

  const editField = (key: keyof typeof emptyEdit, label: string, Icon: typeof UserIcon | null, type = 'text') => (
    <div>
      <label className="field-label" htmlFor={`edit-${key}`}>{label}</label>
      <div className="field-input">
        {Icon && <Icon />}
        <input id={`edit-${key}`} type={type} value={edit[key]} onChange={e => setEdit({ ...edit, [key]: e.target.value })}
          autoComplete="off" max={type === 'date' ? new Date().toISOString().slice(0, 10) : undefined} />
      </div>
    </div>
  );

  const field = (key: keyof typeof emptyForm, label: string, Icon: typeof UserIcon, type = 'text') => (
    <div>
      <label className="field-label" htmlFor={`officer-${key}`}>{label}</label>
      <div className="field-input">
        <Icon />
        <input id={`officer-${key}`} type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} autoComplete={type === 'password' ? 'new-password' : 'off'} />
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Marketing Officers</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>Manage your field officers and their performance</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Close' : '+ Add Officer'}
        </button>
      </div>

      {showAdd && (
        <div className="glass-card" style={{ padding: 20, marginBottom: 20, maxWidth: 720 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>New Officer</h3>
          <ErrorBox>{formError}</ErrorBox>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))', gap: 13 }}>
            {field('firstName', 'First Name *', UserIcon)}
            {field('lastName', 'Last Name *', UserIcon)}
            {field('email', 'Email (login) *', MailIcon, 'email')}
            {field('password', 'Temporary Password *', LockIcon, 'password')}
            {field('territory', 'Territory', PinIcon)}
          </div>
          <button className="btn-primary" style={{ marginTop: 16, maxWidth: 220 }} onClick={addOfficer} disabled={saving}>
            {saving ? <span className="spinner" /> : 'Create Officer'}
          </button>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div className="search-box" style={{ maxWidth: 360 }}>
          <SearchIcon />
          <input placeholder="Search name, email, territory..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search officers" />
        </div>
      </div>

      <ErrorBox>{error}</ErrorBox>

      {officers === null ? <Loading /> : officers.length === 0 ? (
        !error && <div className="glass-card"><EmptyState>No officers found.</EmptyState></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 16 }}>
          {officers.map((o, i) => (
            <div key={o.id} className="glass-card stagger-item" style={{ padding: 20, animationDelay: `${Math.min(i, 10) * 0.07}s`, opacity: o.isActive ? 1 : 0.75 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div className="avatar" style={{ width: 44, height: 44, fontSize: 14, overflow: 'hidden' }}>
                  {o.imgUrl
                    ? <img src={imageUrl(o.imgUrl, 'c_fill,g_face,w_120,h_120')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : getInitials(`${o.firstName} ${o.lastName}`)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="clamp-2" style={{ fontSize: 14.5, fontWeight: 700 }}>{o.firstName} {o.lastName}</span>
                    {o.isActive && <span style={{ display: 'flex', flexShrink: 0, color: 'var(--green-700)' }}><CheckCircleIcon size={14} /></span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.email}</div>
                </div>
                <span className={`badge ${o.isActive ? 'badge-verified' : 'badge-rejected'}`}>{o.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: o.phone ? 4 : 12 }}>Territory: <strong style={{ color: 'var(--ink)' }}>{o.territory || '-'}</strong></div>
              {o.phone && <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 12 }}>Mobile: <strong style={{ color: 'var(--ink)' }}>{o.phone}</strong></div>}
              <div style={{ display: 'flex', gap: 2, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                {[
                  { label: 'Total', value: o.stats.total },
                  { label: 'Verified', value: o.stats.verified },
                  { label: 'Pending', value: o.stats.pending },
                  { label: 'Drafts', value: o.stats.drafts },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--green-700)' }}>{s.value}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', fontWeight: 700, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {editId === o.id ? (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <ErrorBox>{editError}</ErrorBox>
                  {editField('firstName', 'First Name *', UserIcon)}
                  {editField('lastName', 'Last Name *', UserIcon)}
                  {editField('email', 'Email (login) *', MailIcon, 'email')}
                  {editField('phone', 'Mobile Number', PhoneIcon, 'tel')}
                  {editField('territory', 'Territory', PinIcon)}
                  {editField('dob', 'Date of Birth', CalendarIcon, 'date')}
                  <div>
                    <label className="field-label" htmlFor="edit-bio">Bio</label>
                    <div className="field-input"><textarea id="edit-bio" rows={3} maxLength={300} value={edit.bio} onChange={e => setEdit({ ...edit, bio: e.target.value })} style={{ resize: 'vertical' }} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-outline" style={{ flex: 0.5, padding: '8px 12px' }} onClick={() => setEditId(null)} disabled={busyId === o.id}>Cancel</button>
                    <button className="btn-primary" style={{ flex: 1, padding: '8px 12px' }} onClick={() => saveEdit(o)} disabled={busyId === o.id}>
                      {busyId === o.id ? <span className="spinner" /> : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : resetId === o.id ? (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="field-input"><LockIcon /><input type="password" autoComplete="new-password" placeholder="New password (min 8)" aria-label="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-outline" style={{ flex: 0.5, padding: '8px 12px' }} onClick={() => { setResetId(null); setNewPassword(''); }}>Cancel</button>
                    <button className="btn-primary" style={{ flex: 1, padding: '8px 12px' }} onClick={() => resetPassword(o)} disabled={busyId === o.id}>
                      {busyId === o.id ? <span className="spinner" /> : 'Set Password'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                  <button onClick={() => startEdit(o)} disabled={busyId === o.id}
                    style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-700)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Edit
                  </button>
                  <button onClick={() => toggleActive(o)} disabled={busyId === o.id}
                    style={{ fontSize: 12, fontWeight: 700, color: o.isActive ? 'var(--red-600)' : 'var(--green-700)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {o.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => { setResetId(o.id); setNewPassword(''); }}
                    style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Reset Password
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
