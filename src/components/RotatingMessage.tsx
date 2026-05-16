import { useEffect, useRef, useState } from 'react';
import './RotatingMessage.css';

interface Props {
  message: string;
  className?: string;
}

export function RotatingMessage({ message, className = '' }: Props) {
  const [displayed, setDisplayed] = useState(message);
  const [fading, setFading] = useState(false);
  const prevRef = useRef(message);

  useEffect(() => {
    if (message === prevRef.current) return;
    setFading(true);
    const t = setTimeout(() => {
      setDisplayed(message);
      prevRef.current = message;
      setFading(false);
    }, 180);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <p className={`rotating-message ${fading ? 'rotating-message--out' : 'rotating-message--in'} ${className}`}>
      {displayed}
    </p>
  );
}
