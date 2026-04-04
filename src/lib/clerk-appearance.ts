export const clerkAppearance = {
  variables: {
    colorPrimary: '#22c55e',
    colorBackground: '#07111f',
    colorInputBackground: 'rgba(8, 15, 28, 0.82)',
    colorInputText: '#e5eefb',
    colorText: '#e5eefb',
    colorTextSecondary: '#8fa3bf',
    colorDanger: '#fb7185',
    borderRadius: '1rem',
    fontFamily: 'var(--font-inter)',
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full shadow-none',
    card: 'border border-white/10 bg-slate-950/70 shadow-[0_32px_100px_-40px_rgba(34,197,94,0.45)] backdrop-blur-2xl',
    headerTitle: 'text-2xl font-semibold tracking-tight text-white',
    headerSubtitle: 'text-sm text-slate-400',
    socialButtonsBlockButton:
      'border border-white/10 bg-white/5 text-slate-100 transition hover:border-white/20 hover:bg-white/10',
    socialButtonsBlockButtonText: 'text-slate-100',
    dividerLine: 'bg-white/10',
    dividerText: 'text-slate-500',
    formFieldLabel: 'text-sm font-medium text-slate-300',
    formFieldInput:
      'h-11 rounded-2xl border border-white/10 bg-slate-950/70 text-slate-100 shadow-inner shadow-black/20 transition focus:border-brand-400 focus:bg-slate-950/90 focus:ring-2 focus:ring-brand-500/20',
    formButtonPrimary:
      'h-11 rounded-2xl bg-brand-500 font-semibold text-slate-950 shadow-[0_12px_40px_-18px_rgba(34,197,94,0.85)] transition hover:-translate-y-0.5 hover:bg-brand-400',
    footerActionText: 'text-slate-500',
    footerActionLink: 'font-medium text-brand-400 transition hover:text-brand-300',
    formResendCodeLink: 'text-brand-400 transition hover:text-brand-300',
    identityPreviewText: 'text-slate-200',
    identityPreviewEditButton: 'text-brand-400 transition hover:text-brand-300',
    alert:
      'rounded-2xl border border-rose-400/20 bg-rose-500/10 text-rose-200',
    alertText: 'text-sm text-rose-200',
    otpCodeFieldInput:
      'rounded-2xl border border-white/10 bg-slate-950/70 text-slate-100',
    formFieldSuccessText: 'text-brand-300',
  },
} as const
