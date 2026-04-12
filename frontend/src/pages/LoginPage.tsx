/**
 * LoginPage.tsx
 *
 * Clinic login screen. Matches v1 clinicLogin.php.
 *
 * - Username + password form with validation
 * - Error message on bad credentials
 * - Language selector (EN / ES)
 * - Redirects to the page the user was trying to reach, or / on success
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface LoginFormValues {
  username: string
  password: string
}

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const { login, isLoading, error, isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  // If already authenticated, skip the login page
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true })
  }, [isAuthenticated, from, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>()

  async function onSubmit(values: LoginFormValues) {
    await login(values.username, values.password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">

        {/* App name */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            {t('APP_NAME')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('LOGIN_PAGE_TITLE')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">

          {/* Error banner */}
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {t(error)}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Username */}
            <div className="mb-4">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-foreground mb-1"
              >
                {t('LOGIN_USERNAME')}
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder={t('LOGIN_USERNAME_PLACEHOLDER')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
                {...register('username', { required: true })}
              />
              {errors.username && (
                <p className="mt-1 text-xs text-destructive">
                  {t('ERROR_REQUIRED_FIELD')}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-1"
              >
                {t('LOGIN_PASSWORD')}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder={t('LOGIN_PASSWORD_PLACEHOLDER')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
                {...register('password', { required: true })}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">
                  {t('ERROR_REQUIRED_FIELD')}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isLoading ? t('LOADING') : t('LOGIN_SUBMIT')}
            </button>
          </form>
        </div>

        {/* Language selector */}
        <div className="mt-4 flex justify-center gap-3 text-sm">
          <span className="text-muted-foreground">{t('LANGUAGE_PROMPT')}:</span>
          <button
            onClick={() => i18n.changeLanguage('en')}
            className={`${
              i18n.language === 'en'
                ? 'text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground'
            } transition-colors`}
          >
            {t('LANGUAGE_EN')}
          </button>
          <span className="text-border">|</span>
          <button
            onClick={() => i18n.changeLanguage('es')}
            className={`${
              i18n.language === 'es'
                ? 'text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground'
            } transition-colors`}
          >
            {t('LANGUAGE_ES')}
          </button>
        </div>

      </div>
    </div>
  )
}
