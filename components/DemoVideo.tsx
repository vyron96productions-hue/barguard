'use client'

import { useState } from 'react'
import Image from 'next/image'

const VIDEO_ID = 'g8Ki-CuYi3E'

export default function DemoVideo() {
  const [playing, setPlaying] = useState(false)

  function play() {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'video_play',
        video_title: 'BarGuard Demo',
        video_provider: 'youtube',
        video_url: `https://youtu.be/${VIDEO_ID}`,
      })
    }
    setPlaying(true)
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.12)',
      aspectRatio: '16/9',
      background: '#0a1628',
    }}>
      {playing ? (
        <iframe
          src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
          title="BarGuard Demo"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
        />
      ) : (
        <button
          onClick={play}
          aria-label="Play BarGuard demo video"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', padding: 0, cursor: 'pointer', background: 'transparent' }}
        >
          <Image
            src="/demo-thumbnail.webp"
            alt="BarGuard demo video thumbnail"
            fill
            sizes="(max-width: 768px) 100vw, 880px"
            style={{ objectFit: 'cover' }}
          />
          {/* Dark overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(2,8,23,0.15) 0%, rgba(2,8,23,0.45) 100%)',
          }} />
          {/* Play button */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 72, height: 72,
              borderRadius: '50%',
              background: 'rgba(245,158,11,0.95)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(245,158,11,0.45), 0 0 0 12px rgba(245,158,11,0.15)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
              className="play-btn-inner"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#020817" style={{ marginLeft: 4 }}>
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
          </div>
          {/* Hover effect via global style */}
          <style>{`
            button:hover .play-btn-inner {
              transform: scale(1.1);
              box-shadow: 0 12px 40px rgba(245,158,11,0.6), 0 0 0 16px rgba(245,158,11,0.12);
            }
          `}</style>
        </button>
      )}
    </div>
  )
}
