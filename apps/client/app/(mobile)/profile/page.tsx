'use client';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { applicationsApi, authApi, fileUrl } from '@/lib/api';
import { formatDate, money } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import { errorMessage, useToast } from '@/lib/toast';
import type { ApplicationStats } from '@/lib/types';
import type { SessionUser } from '@/lib/types';
import { ErrorBox, InfoRow } from '@/components/ui';
import {
  LockIcon, HelpIcon, InfoIcon, LogoutIcon, MoonIcon, EditIcon, UserIcon,
  PhoneIcon, CalendarIcon, CameraIcon,
} from '@/components/icons';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/** Keeps the stored session in step with what /auth/me returns. */
const profileFields = (me: SessionUser): Partial<SessionUser> => ({
  firstName: me.firstName, lastName: me.lastName, phone: me.phone, dob: me.dob, bio: me.bio, imgUrl: me.imgUrl,
});

type Panel = 'password' | 'help' | 'about' | null;

export default function ProfilePage() {
  const { user, token, logout, updateUser } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { theme, toggle } = useTheme();
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [panel, setPanel] = useState<Panel>(null);

  // Edit profile
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);

  // Change password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (!token) return;
    applicationsApi.getStats(token).then(setStats).catch(() => {});
    authApi.me(token).then((me) => updateUser(profileFields(me))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleLogout = () => { logout(); router.push('/'); };
  const initials = (user?.firstName?.[0] || 'O') + (user?.lastName?.[0] || '');

  const startEdit = () => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setPhone(user?.phone || '');
    setDob(user?.dob?.slice(0, 10) || '');
    setBio(user?.bio || '');
    setProfileError('');
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!token) return;
    if (!firstName.trim() || !lastName.trim()) { setProfileError('First and last name are required'); return; }
    if (phone.trim() && !/^\+?[0-9 ]{7,20}$/.test(phone.trim())) { setProfileError('Enter a valid phone number'); return; }
    setSavingProfile(true);
    setProfileError('');
    try {
      const me = await authApi.updateMe({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
        dob: dob || null,
        bio: bio.trim() || null,
      }, token);
      updateUser(profileFields(me));
      setEditing(false);
      toast('Profile updated');
    } catch (err) {
      setProfileError(errorMessage(err, 'Could not update profile'));
    } finally {
      setSavingProfile(false);
    }
  };

  const onPhotoChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !token) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setProfileError('Choose a JPG, PNG or WEBP image'); return; }
    if (file.size > MAX_PHOTO_BYTES) { setProfileError('Photo must be 10 MB or smaller'); return; }
    setPhotoBusy(true);
    setProfileError('');
    try {
      const me = await authApi.uploadPhoto(file, file.name, token);
      updateUser({ imgUrl: me.imgUrl });
      toast('Photo updated');
    } catch (err) {
      setProfileError(errorMessage(err, 'Could not upload photo'));
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    if (!token) return;
    setPhotoBusy(true);
    setProfileError('');
    try {
      const me = await authApi.removePhoto(token);
      updateUser({ imgUrl: me.imgUrl });
      toast('Photo removed');
    } catch (err) {
      setProfileError(errorMessage(err, 'Could not remove photo'));
    } finally {
      setPhotoBusy(false);
    }
  };

  const savePassword = async () => {
    if (!token) return;
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return; }
    setSavingPw(true);
    setPwError('');
    try {
      await authApi.changePassword(currentPw, newPw, token);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setPanel(null);
      toast('Password changed');
    } catch (err) {
      setPwError(errorMessage(err, 'Could not change password'));
    } finally {
      setSavingPw(false);
    }
  };

  const menu = [
    { key: 'password' as Panel, icon: LockIcon, label: 'Change Password', color: 'var(--green-700)', bg: 'rgba(47,210,122,.14)' },
    { key: 'help' as Panel, icon: HelpIcon, label: 'Help Center', color: 'var(--orange-600)', bg: 'var(--orange-tint)' },
    { key: 'about' as Panel, icon: InfoIcon, label: 'About', color: 'var(--ink-soft)', bg: 'rgba(255,255,255,.08)' },
  ];

  return (
    <>
      <div style={{ padding: '14px 20px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 18, fontWeight: 800 }}>Profile</h1>
        <button className="icon-btn" onClick={startEdit} aria-label="Edit profile"><EditIcon size={16} /></button>
      </div>

      {/* Avatar & Name */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 20px 8px' }}>
        <div style={{ position: 'relative' }}>
          <div className="avatar" style={{ width: 80, height: 80, fontSize: 26, overflow: 'hidden' }}>
            {user?.imgUrl
              ? <img src={fileUrl(user.imgUrl)} alt="Profile photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>
          {editing && (
            <button className="icon-btn" onClick={() => photoInput.current?.click()} disabled={photoBusy} aria-label="Change photo"
              style={{ position: 'absolute', right: -4, bottom: -4, width: 32, height: 32, background: 'var(--acc)', color: 'var(--on)' }}>
              {photoBusy ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <CameraIcon size={15} />}
            </button>
          )}
        </div>
        <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onPhotoChosen} />
        {editing && user?.imgUrl && (
          <button type="button" onClick={removePhoto} disabled={photoBusy}
            style={{ marginTop: 10, color: 'var(--red-600)', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', fontSize: 12, fontWeight: 700, padding: 0 }}>
            Remove photo
          </button>
        )}
        {!editing && (
          <>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 12 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 12, color: 'var(--green-700)', fontWeight: 700, marginTop: 2 }}>Marketing Officer</div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>{user?.email}</div>
            <button className="btn-outline" style={{ marginTop: 14, width: 'auto', padding: '9px 18px' }} onClick={startEdit}>
              <EditIcon size={15} /> Edit Profile
            </button>
          </>
        )}
      </div>

      {editing ? (
        /* Edit Profile form */
        <div style={{ padding: '8px 20px 0', display: 'flex', flexDirection: 'column', gap: 13 }}>
          <ErrorBox>{profileError}</ErrorBox>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label className="field-label" htmlFor="pf-first">First Name *</label>
              <div className="field-input"><UserIcon /><input id="pf-first" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label className="field-label" htmlFor="pf-last">Last Name *</label>
              <div className="field-input"><input id="pf-last" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="pf-phone">Mobile Number</label>
            <div className="field-input"><PhoneIcon /><input id="pf-phone" type="tel" autoComplete="tel" placeholder="+94 7X XXX XXXX" value={phone} onChange={e => setPhone(e.target.value)} /></div>
          </div>
          <div>
            <label className="field-label" htmlFor="pf-dob">Date of Birth</label>
            <div className="field-input"><CalendarIcon /><input id="pf-dob" type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={e => setDob(e.target.value)} /></div>
          </div>
          <div>
            <label className="field-label" htmlFor="pf-bio">Bio</label>
            <div className="field-input"><textarea id="pf-bio" rows={3} maxLength={300} placeholder="A few words about you" value={bio} onChange={e => setBio(e.target.value)} style={{ resize: 'vertical' }} /></div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Email: {user?.email} · contact Head Office to change it</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-outline" style={{ flex: 0.5 }} onClick={() => setEditing(false)} disabled={savingProfile}>Cancel</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={saveProfile} disabled={savingProfile || photoBusy}>
              {savingProfile ? <span className="spinner" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      ) : (user?.phone || user?.dob || user?.bio) && (
        /* Personal details */
        <div style={{ padding: '0 20px', marginTop: 12 }}>
          <div className="menu-card" style={{ padding: '2px 15px' }}>
            {user?.phone && <InfoRow label="Mobile" value={user.phone} />}
            {user?.dob && <InfoRow label="Date of Birth" value={formatDate(user.dob)} />}
            {user?.bio && <InfoRow label="Bio" value={user.bio} />}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ padding: '0 20px', marginTop: 16 }}>
        <div className="pf-stats">
          {[
            { val: stats?.total ?? '–', label: 'Clients' },
            { val: stats?.verified ?? '–', label: 'Verified' },
            { val: stats ? stats.pending + stats.drafts : '–', label: 'Pending' },
            { val: stats?.rejected ?? '–', label: 'Postponed' },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green-700)' }}>{s.val}</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-soft)', fontWeight: 700, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {stats && (
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', textAlign: 'center', marginTop: 10 }}>
            Verified investments: <strong style={{ color: 'var(--ink)' }}>{money(stats.totalInvestment)}</strong>
          </div>
        )}
      </div>

      {/* Menu */}
      <div style={{ padding: '16px 20px 0' }}>
        <div className="menu-card">
          <div className="menu-row" role="switch" aria-checked={theme === 'dark'} tabIndex={0} style={{ cursor: 'pointer' }}
            onClick={toggle} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(110,160,255,.16)', color: '#8DB8FF' }}>
              <MoonIcon size={16} />
            </div>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>Dark Mode</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: theme === 'dark' ? 'var(--green-700)' : 'var(--ink-faint)' }}>{theme === 'dark' ? 'On' : 'Off'}</span>
          </div>
          {menu.map((item) => (
            <div key={item.label}>
              <div className="menu-row" role="button" tabIndex={0} style={{ cursor: 'pointer' }}
                onClick={() => setPanel(panel === item.key ? null : item.key)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPanel(panel === item.key ? null : item.key); } }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.bg, color: item.color }}>
                  <item.icon size={16} />
                </div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{item.label}</span>
                <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="var(--ink-faint)" strokeWidth="1.8" strokeLinecap="round" style={{ transform: panel === item.key ? 'rotate(90deg)' : undefined, transition: 'transform .2s ease' }}><polyline points="1 1 6 6 1 11"/></svg>
              </div>
              {panel === 'password' && item.key === 'password' && (
                <div style={{ padding: '4px 4px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <ErrorBox>{pwError}</ErrorBox>
                  <div className="field-input"><LockIcon /><input type="password" autoComplete="current-password" placeholder="Current password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} /></div>
                  <div className="field-input"><LockIcon /><input type="password" autoComplete="new-password" placeholder="New password (min 8 characters)" value={newPw} onChange={e => setNewPw(e.target.value)} /></div>
                  <div className="field-input"><LockIcon /><input type="password" autoComplete="new-password" placeholder="Confirm new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} /></div>
                  <button className="btn-primary" onClick={savePassword} disabled={savingPw || !currentPw || !newPw}>
                    {savingPw ? <span className="spinner" /> : 'Update Password'}
                  </button>
                </div>
              )}
              {panel === 'help' && item.key === 'help' && (
                <div style={{ padding: '4px 8px 14px', fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                  Tap <strong>+</strong> to onboard a client. Drafts are saved after every step, so you can continue later from the client&apos;s profile. For account or password problems contact your Head Office administrator.
                </div>
              )}
              {panel === 'about' && item.key === 'about' && (
                <div style={{ padding: '4px 8px 14px', fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                  PGG Marketing Field App · Version 1.0.0<br />Prestige Glamour Group — Client Onboarding &amp; Investor Communication
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div style={{ padding: '20px 20px' }}>
        <button className="btn-outline" style={{ color: 'var(--red-600)' }} onClick={handleLogout}>
          <LogoutIcon size={17} />
          Log Out
        </button>
      </div>
    </>
  );
}
