import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth as authApi } from '../services/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import PageWrapper from '../components/layout/PageWrapper';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password flow states
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'new_password' | 'success'>('email');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [wizardName, setWizardName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      const res = await authApi.verifyEmail(recoveryEmail.trim());
      setWizardName(res.data.username);
      setForgotStep('new_password');
    } catch (err: any) {
      setForgotError(err.response?.data?.error || 'Failed to verify email address.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (newPassword.length < 6) {
      setForgotError('Secret password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('New password and confirm password do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      await authApi.resetPassword(recoveryEmail.trim(), newPassword);
      setForgotStep('success');
    } catch (err: any) {
      setForgotError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  const resetToLogin = () => {
    setIsForgotMode(false);
    setForgotStep('email');
    setRecoveryEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setError('');
  };

  return (
    <PageWrapper>
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md">

          <AnimatePresence mode="wait">
            {!isForgotMode ? (
              /* STANDARD LOGIN FORM */
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-heading font-bold mb-2" style={{ color: 'var(--color-accent)' }}>
                    Welcome Back
                  </h1>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Enter the castle, young witch or wizard
                  </p>
                </div>

                <div className="rounded-xl border p-8" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'rgba(212,175,55,0.2)' }}>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="owl@hogwarts.edu"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                    
                    <div>
                      <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                      />
                      <div className="flex justify-end mt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotMode(true);
                            setRecoveryEmail(form.email);
                          }}
                          className="text-xs hover:underline cursor-pointer"
                          style={{ color: 'var(--color-accent)' }}
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>

                    {error && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-sm text-red-400 text-center">{error}</motion.p>
                    )}

                    <Button type="submit" className="w-full" loading={loading}>
                      Enter Hogwarts
                    </Button>
                  </form>

                  <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-secondary)' }}>
                    No enrollment yet?{' '}
                    <Link to="/register" style={{ color: 'var(--color-accent)' }} className="font-semibold hover:underline">
                      Join Hogwarts
                    </Link>
                  </p>
                </div>
              </motion.div>
            ) : (
              /* FORGOT PASSWORD WORKFLOW */
              <motion.div
                key="forgot-password-flow"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
                    style={{ backgroundColor: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}>
                    <KeyRound className="w-6 h-6 text-amber-400" />
                  </div>
                  <h1 className="text-3xl font-heading font-bold mb-2" style={{ color: 'var(--color-accent)' }}>
                    Password Recovery
                  </h1>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Recast your enchantment to regain access
                  </p>
                </div>

                <div className="rounded-xl border p-8" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'rgba(212,175,55,0.2)' }}>
                  
                  {/* STEP 1: VERIFY EMAIL */}
                  {forgotStep === 'email' && (
                    <form onSubmit={handleVerifyEmail} className="space-y-4">
                      <p className="text-xs text-amber-200/80 mb-2">
                        Provide your registered Owl Mail address so the registry can locate your student record.
                      </p>

                      <Input
                        label="Owl Mail Address"
                        type="email"
                        placeholder="owl@hogwarts.edu"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        required
                      />

                      {forgotError && (
                        <p className="text-sm text-red-400 text-center">{forgotError}</p>
                      )}

                      <Button type="submit" className="w-full" loading={forgotLoading}>
                        Verify Owl Mail
                      </Button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={resetToLogin}
                          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-400 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                        </button>
                      </div>
                    </form>
                  )}

                  {/* STEP 2: CREATE & CONFIRM NEW PASSWORD */}
                  {forgotStep === 'new_password' && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg border border-amber-400/20 bg-amber-400/5 mb-3">
                        <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <span className="text-xs text-amber-200">
                          Identified student: <strong>{wizardName}</strong>
                        </span>
                      </div>

                      <Input
                        label="Create New Password"
                        type="password"
                        placeholder="min. 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />

                      <Input
                        label="Confirm New Password"
                        type="password"
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />

                      {forgotError && (
                        <p className="text-sm text-red-400 text-center">{forgotError}</p>
                      )}

                      <Button type="submit" className="w-full" loading={forgotLoading}>
                        ⚡ Reset Password
                      </Button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setForgotStep('email')}
                          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-400 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Use different email
                        </button>
                      </div>
                    </form>
                  )}

                  {/* STEP 3: RESET SUCCESS CONFIRMATION */}
                  {forgotStep === 'success' && (
                    <div className="text-center space-y-4 py-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="font-heading font-bold text-lg text-emerald-300">
                        Password Recast Successfully!
                      </h3>
                      <p className="text-xs text-gray-300">
                        Your enchantment has been updated. Please log in with your new credentials.
                      </p>
                      <Button
                        type="button"
                        onClick={resetToLogin}
                        className="w-full mt-4"
                      >
                        Proceed to Login
                      </Button>
                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </PageWrapper>
  );
}
