import './AppBorderGlow.css';

interface Props {
  active: boolean;
}

export function AppBorderGlow({ active }: Props) {
  return <div className={`app-border-glow ${active ? 'app-border-glow--active' : ''}`} aria-hidden="true" />;
}
