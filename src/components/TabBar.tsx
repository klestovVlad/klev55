import { NavLink } from 'react-router-dom';
import './tabbar.css';

const TABS = [
  { to: '/', label: 'Карта', icon: <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6zm6-2v14m6-12v14" /> },
  { to: '/plan', label: 'План', icon: <path d="M4 5h16v14H4zM4 9h16M9 3v4m6-4v4m-8 6h3m2 0h3" /> },
  { to: '/species', label: 'Рыбы', icon: <path d="M3 12c3-4 7-6 11-6 3 0 5 2 7 6-2 4-4 6-7 6-4 0-8-2-11-6zm0 0l-1-4m1 4l-1 4m14-1v0" /> },
  { to: '/rules', label: 'Правила', icon: <path d="M6 3h9l4 4v14H6zM15 3v4h4M9 12h6M9 16h6" /> },
];

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Разделы">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => `tabbar__item${isActive ? ' tabbar__item--on' : ''}`}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {t.icon}
          </svg>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
