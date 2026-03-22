'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const GREETING = "Hey! I'm the BarGuard assistant. What's going on at your bar — are you dealing with shrinkage, looking into pricing, or just figuring out if this is right for you?"

const QUICK_QUESTIONS = [
  'How does the free trial work?',
  'What POS systems do you connect to?',
  'How much does it cost?',
  'How does invoice scanning work?',
]

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '12px 16px' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#f59e0b', opacity: 0.6,
            display: 'inline-block',
            animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [showPulse, setShowPulse] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (open && started) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, started])

  function handleOpen() {
    setOpen(true)
    setShowPulse(false)
    if (!started) {
      setStarted(true)
      setMessages([{ role: 'assistant', content: GREETING }])
    }
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    // Add empty assistant message to stream into
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok || !res.body) throw new Error('Failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        const final = accumulated
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: final }
          return updated
        })
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: "Sorry, something went wrong on my end. Try emailing support@barguard.app — they'll get back to you fast.",
        }
        return updated
      })
    } finally {
      setLoading(false)
    }
  }, [messages, loading])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const showQuickQuestions = messages.length === 1 && !loading

  return (
    <>
      <style>{`
        @keyframes dot-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes chat-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
          50% { box-shadow: 0 0 0 10px rgba(245,158,11,0); }
        }
        @keyframes chat-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chat-panel {
          animation: chat-in 0.22s ease forwards;
        }
        .chat-msg-user { align-self: flex-end; }
        .chat-msg-ai { align-self: flex-start; }
        .chat-input-area {
          border: none; outline: none; resize: none;
          background: transparent; color: #f1f5f9;
          font-size: 14px; line-height: 1.5;
          flex: 1; max-height: 100px; overflow-y: auto;
          font-family: inherit;
        }
        .chat-input-area::placeholder { color: #475569; }
        .chat-input-area::-webkit-scrollbar { width: 4px; }
        .chat-input-area::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        .chat-send-btn {
          width: 34px; height: 34px; border-radius: 8px;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          background: #f59e0b; color: #020817;
          transition: background 0.15s, opacity 0.15s;
          flex-shrink: 0;
        }
        .chat-send-btn:disabled { opacity: 0.4; cursor: default; }
        .chat-send-btn:not(:disabled):hover { background: #fbbf24; }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        .quick-chip {
          background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.2);
          color: #94a3b8; font-size: 12px;
          padding: 6px 12px; border-radius: 100px;
          cursor: pointer; white-space: nowrap;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          font-family: inherit;
        }
        .quick-chip:hover {
          background: rgba(245,158,11,0.15);
          border-color: rgba(245,158,11,0.4);
          color: #f59e0b;
        }
        @media (max-width: 480px) {
          .chat-panel-pos { right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 85vh !important; border-radius: 20px 20px 0 0 !important; }
        }
      `}</style>

      {/* Floating button */}
      {!open && (
        <button
          onClick={handleOpen}
          aria-label="Open chat"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 100,
            width: 56, height: 56, borderRadius: '50%',
            background: '#f59e0b', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(245,158,11,0.35), 0 2px 8px rgba(0,0,0,0.4)',
            animation: showPulse ? 'chat-pulse 2.5s ease-in-out infinite' : 'none',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="#020817" opacity="0.9" />
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#020817" strokeWidth="1" />
            <circle cx="9" cy="10" r="1.2" fill="#f59e0b" />
            <circle cx="12" cy="10" r="1.2" fill="#f59e0b" />
            <circle cx="15" cy="10" r="1.2" fill="#f59e0b" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="chat-panel chat-panel-pos"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 100,
            width: 380, height: 560,
            background: '#0a1220',
            border: '1px solid #1e293b',
            borderRadius: 20,
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid #1e293b',
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#0f172a',
            flexShrink: 0,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 16 }}>✦</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: '#f1f5f9', margin: 0 }}>BarGuard Assistant</p>
              <p style={{ fontSize: 11, color: '#22c55e', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} />
                Online
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            className="chat-scroll"
            style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg-${msg.role === 'user' ? 'user' : 'ai'}`} style={{ display: 'flex', flexDirection: 'column', maxWidth: '85%' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user' ? 'rgba(245,158,11,0.12)' : '#0f172a',
                  border: msg.role === 'user' ? '1px solid rgba(245,158,11,0.2)' : '1px solid #1e293b',
                  fontSize: 13.5,
                  color: '#e2e8f0',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.content || (msg.role === 'assistant' && i === messages.length - 1 && loading ? <TypingDots /> : '')}
                </div>
              </div>
            ))}

            {/* Typing indicator shown before any text streams in */}
            {loading && messages[messages.length - 1]?.content === '' && (
              <div className="chat-msg-ai" style={{ display: 'flex', flexDirection: 'column', maxWidth: '85%' }}>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px 14px 14px 4px' }}>
                  <TypingDots />
                </div>
              </div>
            )}

            {/* Quick question chips */}
            {showQuickQuestions && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {QUICK_QUESTIONS.map(q => (
                  <button key={q} className="quick-chip" onClick={() => sendMessage(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 14px',
            borderTop: '1px solid #1e293b',
            background: '#0f172a',
            display: 'flex', alignItems: 'flex-end', gap: 10,
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              className="chat-input-area"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about BarGuard..."
              rows={1}
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            />
            <button
              className="chat-send-btn"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
