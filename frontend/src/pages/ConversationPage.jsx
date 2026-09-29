import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { sendChatMessage, saveHealthProfile, analyzeHealth } from '../utils/api';
import toast from 'react-hot-toast';

const SESSION_ID = `chat_${Date.now()}`;

export default function ConversationPage() {
  const navigate = useNavigate();
  const { requireLogin, setHealthProfile } = useApp();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello dear! I'm MamaAI, your maternal health companion 🌸 I'm here to gently listen and guide you through your pregnancy. Let's have a comfortable conversation — just like visiting your doctor or midwife!\n\nTo get started, could you share how many weeks pregnant you are?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [collectedData, setCollectedData] = useState({});
  const [analysisReady, setAnalysisReady] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input, timestamp: new Date() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage({ message: input, session_id: SESSION_ID });
      const aiMsg = { role: 'assistant', content: res.data.response, timestamp: new Date() };
      setMessages(m => [...m, aiMsg]);
      if (res.data.collected_data) {
        const newData = { ...collectedData, ...res.data.collected_data };
        setCollectedData(newData);
        if (newData.weight && newData.week_of_pregnancy) setAnalysisReady(true);
      }
    } catch (err) {
      toast.error('Failed to send message');
      setMessages(m => [...m, { role: 'assistant', content: "I'm right here with you! Could you please repeat that? 🌸", timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    requireLogin(async () => {
      setLoading(true);
      try {
        const analysisRes = await analyzeHealth(collectedData);
        const analysis = analysisRes.data.analysis;
        await saveHealthProfile({ ...collectedData, ai_analysis: analysis, nutrient_requirements: analysis });
        setHealthProfile({ ...collectedData, ai_analysis: analysis, nutrient_requirements: analysis });
        toast.success('Analysis complete! Redirecting to dashboard 🌸');
        navigate('/dashboard/nutrition');
      } catch {
        toast.error('Analysis failed. Please try again.');
      } finally {
        setLoading(false);
      }
    });
  };

  const quickReplies = [
    "I'm 24 weeks pregnant",
    "I have some morning nausea",
    "My BP is 120/80 mmHg",
    "I'm vegetarian",
    "My iron is slightly low",
    "I take prenatal vitamins daily"
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px clamp(12px, 3vw, 24px)',
        background: 'rgba(255, 248, 252, 0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(232, 99, 154, 0.16)',
        position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 2px 14px rgba(155, 114, 207, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>← Back</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #e8639a, #9b72cf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', boxShadow: '0 4px 14px rgba(232, 99, 154, 0.35)', flexShrink: 0 }}>🌸</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)', color: 'var(--text-primary)' }}>MamaAI Doctor</div>
              <div style={{ fontSize: '0.68rem', color: '#2aaa8f', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3dbfa8', animation: 'pulse-glow 2s infinite' }}></div>
                Active
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {analysisReady && (
            <button className="btn-primary" onClick={handleAnalyze} disabled={loading} style={{ fontSize: 'clamp(0.75rem, 2.2vw, 0.82rem)', padding: '7px 14px' }}>
              🔍 View Analysis
            </button>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(14px, 3vw, 24px) clamp(10px, 3vw, 20px)', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 840, margin: '0 auto', width: '100%' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 10 }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #e8639a, #9b72cf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', flexShrink: 0, marginBottom: 4, boxShadow: '0 2px 8px rgba(232, 99, 154, 0.3)' }}>🌸</div>
            )}
            <div>
              <div className={`chat-bubble ${msg.role}`} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                {msg.content}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left', paddingLeft: msg.role === 'assistant' ? 4 : 0 }}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {msg.role === 'user' && (
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(232, 99, 154, 0.15)', border: '1px solid rgba(232, 99, 154, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', flexShrink: 0, marginBottom: 4 }}>👩</div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #e8639a, #9b72cf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem' }}>🌸</div>
            <div className="chat-bubble assistant" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-pink)', animation: `pulse-glow 1.2s ${d}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Replies Bar */}
      <div style={{ padding: '10px 24px', borderTop: '1px solid rgba(232, 99, 154, 0.12)', background: 'rgba(255, 248, 252, 0.75)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap', maxWidth: 840, margin: '0 auto' }}>
          {quickReplies.map(r => (
            <button key={r} onClick={() => setInput(r)}
              style={{
                whiteSpace: 'nowrap', padding: '7px 15px', borderRadius: 20,
                border: '1px solid rgba(232, 99, 154, 0.25)',
                background: 'rgba(255, 255, 255, 0.85)',
                color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '0.8rem',
                fontWeight: 500, transition: 'all 0.2s', fontFamily: 'Inter, sans-serif'
              }}
              onMouseEnter={e => e.target.style.background = 'rgba(232, 99, 154, 0.12)'}
              onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.85)'}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div style={{ padding: '16px 24px', background: 'rgba(255, 248, 252, 0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(232, 99, 154, 0.15)', boxShadow: '0 -2px 16px rgba(155, 114, 207, 0.05)' }}>
        <div style={{ display: 'flex', gap: 12, maxWidth: 840, margin: '0 auto', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder="Share how you're feeling today... (Press Enter to send)"
            className="neuro-input"
            style={{ flex: 1, resize: 'none', minHeight: 52, maxHeight: 120, lineHeight: 1.5, paddingTop: 14 }}
            rows={1}
          />
          <button className="btn-primary" onClick={sendMessage} disabled={!input.trim() || loading}
            style={{ padding: '14px 22px', borderRadius: 12, flexShrink: 0, opacity: !input.trim() ? 0.5 : 1 }}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
}
