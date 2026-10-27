'use client';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { authApi, healthApi, imageUrl } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { errorMessage, useToast } from '@/lib/toast';
import { MAX_UPLOAD_BYTES, shrinkImage } from '@/lib/image';
import { ErrorBox } from '@/components/ui';
import type { SessionUser } from '@/lib/types';
import { MoonIcon, ShieldIcon, SettingsIcon, LockIcon, UserIcon, PhoneIcon, CalendarIcon, CameraIcon } from '@/components/icons';


/** Keeps the stored session in step with what /auth/me returns. */
const profileFields = (me: SessionUser): Partial<SessionUser> => ({
  firstName: me.firstName, lastName: me.lastName, phone: me.phone, dob: me.dob, bio: me.bio, imgUrl: me.imgUrl,
});

export default function AdminSettingsPage() {
  const { user, token, updateUser } = useAuth();
  const toast = useToast();
  const { theme, toggle } = useTheme();
  const darkMode = theme === 'dark';

  const [health, setHealth] = useState<{ api: boolean; db: boolean } | null>(null);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dob, setDob] = useState(user?.dob?.slice(0, 10) || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    healthApi.check()
      .then((h) => setHealth({ api: true, db: h.database === 'up' }))
      .catch(() => setHealth({ api: false, db: false }));
  }, []);

  useEffect(() => {
    if (!token) return;
    authApi.me(token).then((me) => {
      updateUser(profileFields(me));
      setFirstName(me.firstName || '');
      setLastName(me.lastName || '');
      setPhone(me.phone || '');
      setDob(me.dob?.slice(0, 10) || '');
      setBio(me.bio || '');
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
      toast('Profile updated');
    } catch (err) {
      setProfileError(errorMessage(err, 'Could not update profile'));
    } finally {
      setSavingProfile(false);
    }
  };

  const onPhotoChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    e.target.value = '';
    if (!chosen || !token) return;
    if (!/^image\/(jpeg|png|webp)$/.test(chosen.type)) { setProfileError('Choose a JPG, PNG or WEBP image'); return; }
    setPhotoBusy(true);
    setProfileError('');
    try {
      const file = await shrinkImage(chosen);
      if (file.size > MAX_UPLOAD_BYTES) { setProfileError('Photo must be 4 MB or smaller'); return; }
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
      toast('Password changed');
    } catch (err) {
      setPwError(errorMessage(err, 'Could not change password'));
    } finally {
      setSavingPw(false);
    }
  };

  const statusBadge = (ok: boolean | undefined, okText: string, badText: string) =>
    health === null ? <span className="badge badge-pending">Checking…</span>
      : ok ? <span className="badge badge-verified">{okText}</span>
        : <span className="badge badge-rejected">{badText}</span>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>Manage your account and system preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))', gap: 20 }}>
        {/* Account */}
        <div className="glass-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserIcon size={17} /> Account
          </h3>
          <ErrorBox>{profileError}</ErrorBox>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <div style={{ position: 'relative' }}>
              <div className="avatar" style={{ width: 56, height: 56, fontSize: 18, overflow: 'hidden' }}>
                {user?.imgUrl
                  ? <img src={imageUrl(user.imgUrl, 'c_fill,g_face,w_200,h_200')} alt="Profile photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (user?.firstName?.[0] || 'A') + (user?.lastName?.[0] || '')}
              </div>
              <button className="icon-btn" onClick={() => photoInput.current?.click()} disabled={photoBusy} aria-label="Change photo"
                style={{ position: 'absolute', right: -6, bottom: -6, width: 28, height: 28, background: 'var(--acc)', color: 'var(--on)' }}>
                {photoBusy ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <CameraIcon size={13} />}
              </button>
            </div>
            <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onPhotoChosen} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
              {user?.imgUrl && (
                <button type="button" onClick={removePhoto} disabled={photoBusy}
                  style={{ marginTop: 4, color: 'var(--red-600)', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', fontSize: 12, fontWeight: 700, padding: 0 }}>
                  Remove photo
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="field-input" style={{ flex: 1 }}><UserIcon /><input aria-label="First name" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
              <div className="field-input" style={{ flex: 1 }}><input aria-label="Last name" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
            </div>
            <div className="field-input"><PhoneIcon /><input type="tel" autoComplete="tel" aria-label="Mobile number" placeholder="Mobile number" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div className="field-input"><CalendarIcon /><input type="date" aria-label="Date of birth" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={e => setDob(e.target.value)} /></div>
            <div className="field-input"><textarea aria-label="Bio" rows={3} maxLength={300} placeholder="A few words about you" value={bio} onChange={e => setBio(e.target.value)} style={{ resize: 'vertical' }} /></div>
          </div>
          <button className="btn-primary" style={{ marginTop: 12 }} onClick={saveProfile} disabled={savingProfile || photoBusy}>
            {savingProfile ? <span className="spinner" /> : 'Save Profile'}
          </button>
        </div>

        {/* Appearance */}
        <div className="glass-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MoonIcon size={17} /> Appearance
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Dark Mode</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>Saved on this device</div>
            </div>
            <button onClick={toggle} role="switch" aria-checked={darkMode} aria-label="Dark mode" style={{
              width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
              background: darkMode ? 'var(--green-700)' : 'var(--line)',
              position: 'relative', transition: 'background .2s ease',
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
                left: darkMode ? 25 : 3, transition: 'left .2s ease',
              }} />
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="glass-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldIcon size={17} /> Change Password
          </h3>
          <ErrorBox>{pwError}</ErrorBox>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="field-input"><LockIcon /><input type="password" autoComplete="current-password" placeholder="Current password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} /></div>
            <div className="field-input"><LockIcon /><input type="password" autoComplete="new-password" placeholder="New password (min 8 characters)" value={newPw} onChange={e => setNewPw(e.target.value)} /></div>
            <div className="field-input"><LockIcon /><input type="password" autoComplete="new-password" placeholder="Confirm new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} /></div>
            <button className="btn-primary" onClick={savePassword} disabled={savingPw || !currentPw || !newPw}>
              {savingPw ? <span className="spinner" /> : 'Update Password'}
            </button>
          </div>
        </div>

        {/* System */}
        <div className="glass-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingsIcon size={17} /> System
          </h3>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 2 }}>
            <div>App Version: <strong style={{ color: 'var(--ink)' }}>1.0.0</strong></div>
            <div>API Status: {statusBadge(health?.api, 'Connected', 'Unreachable')}</div>
            <div>Database: {statusBadge(health?.db, 'Healthy', 'Down')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
