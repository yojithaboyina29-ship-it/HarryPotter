import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Inbox, Mail, Sparkles } from 'lucide-react';
import { letters as lettersApi } from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import PageWrapper from '../components/layout/PageWrapper';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface Letter {
  id: number;
  subject: string;
  body: string;
  styledBody?: string;
  owlName: string;
  isRead: boolean;
  isDelivered: boolean;
  sentAt: string;
  deliveredAt: string;
  senderUsername?: string;
  recipientUsername?: string;
}

function OwlAnimation() {
  return (
    <motion.div className="text-4xl"
      animate={{ x: [-20, 20, -20], y: [0, -8, 0], rotate: [-5, 5, -5] }}
      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}>
      🦉
    </motion.div>
  );
}

export default function OwlPost() {
  const [tab, setTab] = useState<'inbox' | 'compose'>('inbox');
  const [inbox, setInbox] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);

  // Compose state
  const [form, setForm] = useState({ to: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [previewStyled, setPreviewStyled] = useState('');
  const [stylingText, setStylingText] = useState(false);
  const [useStyled, setUseStyled] = useState(false);
  const [sendSuccess, setSendSuccess] = useState('');
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    lettersApi.getInbox()
      .then(res => setInbox(res.data.letters || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openLetter = async (letter: Letter) => {
    setSelectedLetter(letter);
    if (!letter.isRead && letter.isDelivered) {
      await lettersApi.markRead(letter.id).catch(() => {});
      setInbox(prev => prev.map(l => l.id === letter.id ? { ...l, isRead: true } : l));
    }
  };

  const previewMagicStyle = async () => {
    if (!form.body.trim()) return;
    setStylingText(true);
    try {
      const res = await lettersApi.previewStyle(form.body);
      setPreviewStyled(res.data.styled);
    } catch {
      setPreviewStyled('');
    } finally {
      setStylingText(false);
    }
  };

  const sendLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError('');
    setSendSuccess('');
    setSending(true);
    try {
      const res = await lettersApi.send(form.to, form.subject, form.body, useStyled && !!previewStyled);
      setSendSuccess(`Your letter has been entrusted to ${res.data.owlName}! 🦉`);
      setForm({ to: '', subject: '', body: '' });
      setPreviewStyled('');
      setUseStyled(false);
    } catch (err: any) {
      setSendError(err.response?.data?.error || 'Failed to send letter.');
    } finally {
      setSending(false);
    }
  };

  const unreadCount = inbox.filter(l => !l.isRead && l.isDelivered).length;

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold" style={{ color: 'var(--color-accent)' }}>🦉 Owl Post</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Send magical letters across the castle</p>
        </div>
        <OwlAnimation />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['inbox', 'compose'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-semibold font-heading transition-all duration-200 capitalize border"
            style={{
              backgroundColor: tab === t ? 'var(--color-accent)' : 'transparent',
              color: tab === t ? '#1a0a2e' : 'var(--color-text-secondary)',
              borderColor: tab === t ? 'var(--color-accent)' : 'rgba(212,175,55,0.2)',
            }}>
            {t === 'inbox' ? (
              <span className="flex items-center gap-1.5">
                <Inbox className="w-4 h-4" /> Inbox {unreadCount > 0 && `(${unreadCount})`}
              </span>
            ) : (
              <span className="flex items-center gap-1.5"><Send className="w-4 h-4" /> Compose</span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* INBOX */}
        {tab === 'inbox' && (
          <motion.div key="inbox" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            {loading ? (
              <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : inbox.length === 0 ? (
              <Card className="text-center py-12">
                <Mail className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
                <p style={{ color: 'var(--color-text-secondary)' }}>Your mailbox is empty. No owls have visited yet.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {inbox.map(letter => (
                  <motion.div key={letter.id} layout whileHover={{ x: 4 }}>
                    <Card hover onClick={() => openLetter(letter)}
                      className={!letter.isRead && letter.isDelivered ? 'ring-1' : ''}
                      glow={!letter.isRead && letter.isDelivered ? '#d4af37' : undefined}>
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {!letter.isDelivered ? '🦉' : letter.isRead ? '📬' : '📨'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                              {letter.subject}
                              {!letter.isRead && letter.isDelivered && (
                                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full"
                                  style={{ backgroundColor: 'rgba(212,175,55,0.2)', color: 'var(--color-accent)' }}>NEW</span>
                              )}
                            </p>
                            <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                              {new Date(letter.sentAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            From: <span className="font-medium" style={{ color: 'var(--color-accent)' }}>{letter.senderUsername}</span>
                            {' '}via <span className="italic">{letter.owlName}</span>
                          </p>
                          {!letter.isDelivered && (
                            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                              ✈️ En route — arrives {new Date(letter.deliveredAt).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>

                    {/* Expanded letter */}
                    <AnimatePresence>
                      {selectedLetter?.id === letter.id && letter.isDelivered && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden">
                          <div className="mt-2 p-5 rounded-xl border"
                            style={{ backgroundColor: 'rgba(26,10,46,0.8)', borderColor: 'rgba(212,175,55,0.15)' }}>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                              {letter.styledBody || letter.body}
                            </p>
                            {letter.styledBody && letter.styledBody !== letter.body && (
                              <p className="text-xs mt-3 italic" style={{ color: 'var(--color-accent)' }}>
                                ✨ Magically styled
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* COMPOSE */}
        {tab === 'compose' && (
          <motion.div key="compose" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="max-w-2xl">
              <form onSubmit={sendLetter} className="space-y-4">
                <Input label="To (username)" placeholder="recipient_wizard" value={form.to}
                  onChange={e => setForm({ ...form, to: e.target.value })} required />
                <Input label="Subject" placeholder="A matter of great importance..." value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })} required />

                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Message</label>
                  <textarea rows={6} required
                    placeholder="Compose your letter here..."
                    value={form.body} onChange={e => setForm({ ...form, body: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border bg-transparent text-sm outline-none transition-all duration-200 resize-none"
                    style={{ borderColor: 'rgba(212,175,55,0.3)', color: 'var(--color-text-primary)' }} />
                </div>

                {/* Magic style preview */}
                {form.body.trim() && (
                  <div className="flex flex-col gap-3 p-4 rounded-xl border"
                    style={{ borderColor: 'rgba(212,175,55,0.15)', backgroundColor: 'rgba(212,175,55,0.03)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--color-accent)' }}>
                        <Sparkles className="w-4 h-4" /> Magical Flair
                      </span>
                      <Button type="button" variant="ghost" size="sm" onClick={previewMagicStyle} loading={stylingText}>
                        Preview
                      </Button>
                    </div>
                    {previewStyled && (
                      <>
                        <p className="text-xs italic leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                          {previewStyled}
                        </p>
                        <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          <input type="checkbox" checked={useStyled} onChange={e => setUseStyled(e.target.checked)}
                            className="accent-yellow-500" />
                          Send with magical styling
                        </label>
                      </>
                    )}
                  </div>
                )}

                {sendError && <p className="text-red-400 text-sm">{sendError}</p>}
                {sendSuccess && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                    {sendSuccess}
                  </motion.p>
                )}

                <Button type="submit" loading={sending} className="w-full">
                  <Send className="w-4 h-4" /> Send by Owl Post
                </Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
