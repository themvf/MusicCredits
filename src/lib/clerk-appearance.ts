export const clerkAppearance = {
  variables: {
    colorPrimary: '#C8F000',
    colorBackground: '#0D0D0D',
    colorInputBackground: '#111111',
    colorInputText: '#ffffff',
    colorText: '#ffffff',
    colorTextSecondary: 'rgba(255,255,255,0.4)',
    colorDanger: '#fb7185',
    borderRadius: '0.75rem',
    fontFamily: 'var(--font-inter)',
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full shadow-none',
    card: 'border border-white/8 bg-[#111111]',
    headerTitle: 'text-2xl font-black tracking-tight text-white',
    headerSubtitle: 'text-sm text-white/40',
    socialButtonsBlockButton:
      'border border-white/10 bg-white/[0.04] text-white transition hover:border-white/20 hover:bg-white/8',
    socialButtonsBlockButtonText: 'text-white',
    dividerLine: 'bg-white/10',
    dividerText: 'text-white/30',
    formFieldLabel: 'text-sm font-medium text-white/60',
    formFieldInput:
      'h-11 rounded-xl border border-white/10 bg-[#111111] text-white shadow-none transition focus:border-acid/40 focus:ring-2 focus:ring-acid/15',
    formButtonPrimary:
      'h-11 rounded-xl bg-acid font-bold text-[#0D0D0D] transition hover:-translate-y-0.5 hover:opacity-90',
    footerActionText: 'text-white/30',
    footerActionLink: 'font-medium text-acid transition hover:text-acid/80',
    formResendCodeLink: 'text-acid transition hover:text-acid/80',
    identityPreviewText: 'text-white',
    identityPreviewEditButton: 'text-acid transition hover:text-acid/80',
    alert: 'rounded-xl border border-rose-400/20 bg-rose-500/10 text-rose-200',
    alertText: 'text-sm text-rose-200',
    otpCodeFieldInput: 'rounded-xl border border-white/10 bg-[#111111] text-white',
    formFieldSuccessText: 'text-acid',
  },
} as const
