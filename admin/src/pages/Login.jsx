import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { ErrorBox, Loading } from '../components/ui.jsx';
import SchoolIcon from '@mui/icons-material/School';

export default function Login() {
  const { admin, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="login-wrap"><Loading /></div>;
  if (admin) return <Navigate to={location.state?.from || '/'} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-logo"><SchoolIcon fontSize="inherit" /></div>
        <h1>لوحة التحكم</h1>
        <p className="sub">عايد أكاديمي — إدارة المحتوى</p>

        <ErrorBox error={error} />

        <div className="field">
          <label htmlFor="email">البريد الإلكتروني</label>
          <input
            id="email"
            type="email"
            className="ltr"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="username"
            required
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="password">كلمة المرور</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button
          className="btn btn-primary"
          type="submit"
          disabled={busy}
          style={{ width: '100%', marginTop: '0.5rem' }}
        >
          {busy ? <><span className="spinner" /> جاري الدخول...</> : 'دخول'}
        </button>
      </form>
    </div>
  );
}
