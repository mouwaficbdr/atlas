'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    if (!cursor || !follower) return;

    let currentContext = 'default';

    const onMouseMove = (e: MouseEvent) => {
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1 });
      gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.3 });

      const target = e.target as HTMLElement;
      let newContext = 'default';
      
      if (target) {
        if (target.tagName.toLowerCase() === 'canvas') {
          newContext = 'globe';
        } else if (
          target.tagName.toLowerCase() === 'a' || 
          target.tagName.toLowerCase() === 'button' ||
          target.closest('a') || 
          target.closest('button')
        ) {
          newContext = 'interactive';
        }
      }

      if (newContext !== currentContext) {
        currentContext = newContext;
        if (newContext === 'globe') {
          gsap.to(cursor, { scale: 0.5, backgroundColor: '#ffffff', duration: 0.2 });
          gsap.to(follower, { scale: 1.5, borderRadius: '0%', border: '1px dashed rgba(255,255,255,0.5)', duration: 0.2 });
        } else if (newContext === 'interactive') {
          gsap.to(cursor, { scale: 0, duration: 0.2 });
          gsap.to(follower, { scale: 1.5, backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.8)', duration: 0.2 });
        } else {
          gsap.to(cursor, { scale: 1, backgroundColor: 'var(--text-accent)', duration: 0.2 });
          gsap.to(follower, { scale: 1, borderRadius: '50%', backgroundColor: 'transparent', border: '1px solid var(--text-accent)', duration: 0.2 });
        }
      }
    };

    const onMouseDown = () => {
      gsap.to([cursor, follower], { scale: 0.8, duration: 0.2, overwrite: 'auto' });
    };

    const onMouseUp = () => {
      if (currentContext === 'globe' || currentContext === 'interactive') {
        gsap.to(follower, { scale: 1.5, duration: 0.2, overwrite: 'auto' });
      } else {
        gsap.to([cursor, follower], { scale: 1, duration: 0.2, overwrite: 'auto' });
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <>
      <div
        ref={cursorRef}
        className="custom-cursor"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '8px',
          height: '8px',
          backgroundColor: 'var(--text-accent)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        ref={followerRef}
        className="custom-cursor-follower"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '32px',
          height: '32px',
          border: '1px solid var(--text-accent)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9998,
          transform: 'translate(-50%, -50%)',
          opacity: 0.5,
        }}
      />
    </>
  );
}
