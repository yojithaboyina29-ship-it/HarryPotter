import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import PageWrapper from '../components/layout/PageWrapper';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold mb-2" style={{ color: 'var(--color-accent)' }}>
              Welcome Back
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Enter the castle, young witch or wizard
            </p>
          </div>

          <div className="rounded-xl border p-8" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'rgba(212,175,55,0.2)' }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input label="Email Address" type="email" placeholder="owl@hogwarts.edu"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <Input label="Password" type="password" placeholder="••••••••"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
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
      </div>
    </PageWrapper>
  );
}
