import { useState, type SubmitEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { Brand, CourtArt } from '@/components/layout/DashboardLayout'
import { Button, FormField, InlineError } from '@/components/ui'
import { useAction } from '@/lib/resource'
import { useAuthStore } from '@/stores/authStore'

export function LoginPage() {
  const owner = useAuthStore(state => state.owner)
  const login = useAuthStore(state => state.login)
  const [showPassword, setShowPassword] = useState(false)
  const action = useAction()

  if (owner) return <Navigate to="/dashboard" replace />

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    void action.run(() => login(String(data.get('email')).trim(), String(data.get('password'))))
  }

  return (
    <main className="login">
      <div className="login-main">
        <Brand />
        <div className="login-content">
          <span className="section-icon">
            <LockKeyhole size={21} />
          </span>
          <h1>Acceso de propietarios</h1>
          <p>Ingresa con la cuenta asignada a tu recinto.</p>
          <form className="form-stack" onSubmit={submit}>
            <FormField>
              <span>Correo electrónico</span>
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="nombre@correo.cl"
              />
            </FormField>
            <div className="password-field">
              <FormField>
                <span>Contraseña</span>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                />
              </FormField>
              <Button
                className="button--quiet icon-button"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword(value => !value)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
            </div>
            <InlineError>{action.error}</InlineError>
            <Button type="submit" disabled={action.busy}>
              {action.busy ? 'Ingresando…' : 'Iniciar sesión'}
            </Button>
          </form>
        </div>
      </div>
      <div className="login-art">
        <CourtArt />
        <div>
          <p>Tu recinto, tus canchas y tus torneos.</p>
        </div>
      </div>
    </main>
  )
}
