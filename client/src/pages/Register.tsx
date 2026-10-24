import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import PageWrapper from '../components/layout/PageWrapper';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate('/sorting');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
              Enroll at Hogwarts
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Your magical journey begins here
            </p>
          </div>

          <div className="rounded-xl border p-8" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'rgba(212,175,55,0.2)' }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input label="Wizard Name" type="text" placeholder="hermione_g"
                value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              <Input label="Owl Mail Address" type="email" placeholder="owl@hogwarts.edu"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <Input label="Secret Password" type="password" placeholder="min. 6 characters"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-sm text-red-400 text-center">{error}</motion.p>
              )}
              <Button type="submit" className="w-full" loading={loading}>
                ✨ Begin Enrollment
              </Button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-secondary)' }}>
              Already enrolled?{' '}
              <Link to="/login" style={{ color: 'var(--color-accent)' }} className="font-semibold hover:underline">
                Enter the castle
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
