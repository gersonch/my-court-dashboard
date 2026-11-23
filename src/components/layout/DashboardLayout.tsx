import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Building2,
  CalendarDays,
  CalendarRange,
  LayoutGrid,
  LogOut,
  PanelTop,
  Trophy,
} from 'lucide-react'
import { Button, InlineError } from '@/components/ui'
import { useAction } from '@/lib/resource'
import { formatDate, initials } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useWorkspaceStore } from '@/stores/complexStore'

export const SECTIONS = [
  { label: 'Resumen', href: '/dashboard', Icon: LayoutGrid, end: true },
  { label: 'Mi recinto', href: '/dashboard/complex', Icon: Building2 },
  { label: 'Canchas', href: '/dashboard/fields', Icon: PanelTop },
  { label: 'Agenda', href: '/dashboard/reservations', Icon: CalendarDays },
  { label: 'Torneos', href: '/dashboard/tournaments', Icon: Trophy },
]

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        <span />
      </span>
      <span>My Court</span>
    </div>
  )
}

export function CourtArt() {
  return (
    <div className="court-art" aria-hidden="true">
      <div className="court-outer">
        <div className="court-inner" />
        <span className="court-divider" />
      </div>
      <span className="court-ball" />
    </div>
  )
}

export function DashboardLayout() {
  const owner = useAuthStore(state => state.owner)
  const logout = useAuthStore(state => state.logout)
  const complex = useWorkspaceStore(state => state.complex)
  const action = useAction()
  const { pathname } = useLocation()
  const section = SECTIONS.find(item => item.href === pathname)

  return (
    <div className="app-shell">
      <a className="skip-link" href="#dashboard-content">
        Saltar al contenido
      </a>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Brand />
          <span>Panel de propietarios</span>
        </div>
        <nav className="side-nav" aria-label="Navegación principal">
          {SECTIONS.map(({ href, label, Icon, end }) => (
            <NavLink key={href} to={href} end={end}>
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-venue">
            <span className="sidebar-venue-icon">
              <Building2 size={17} />
            </span>
            <div>
              <small>Mi recinto</small>
              <strong>{complex.data?.name ?? 'My Court'}</strong>
            </div>
          </div>
          <Button
            className="button--quiet"
            onClick={() => action.run(logout)}
            disabled={action.busy}
          >
            <LogOut size={17} /> Cerrar sesión
          </Button>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Panel de propietarios</span>
            <span aria-hidden="true">/</span>
            <strong>{section?.label ?? 'Resumen'}</strong>
          </div>
          <div className="topbar-actions">
            <div className="topbar-date">
              <CalendarRange size={16} />
              <span>{formatDate(new Date())}</span>
            </div>
            <span className="avatar" title={owner!.name} aria-label={owner!.name}>
              {initials(owner!.name)}
            </span>
            <Button
              className="button--quiet icon-button mobile-logout"
              aria-label="Cerrar sesión"
              onClick={() => action.run(logout)}
              disabled={action.busy}
            >
              <LogOut size={18} />
            </Button>
          </div>
        </header>
        <main id="dashboard-content" className="main-content" tabIndex={-1}>
          <InlineError>{action.error}</InlineError>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
