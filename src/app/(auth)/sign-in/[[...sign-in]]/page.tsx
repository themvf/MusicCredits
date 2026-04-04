import { SignIn } from '@clerk/nextjs'
import AuthShell from '@/components/AuthShell'

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back to the exchange"
      description="Pick up where your release momentum left off. Review your queue, earn credits, and launch the next submission."
    >
      <SignIn />
    </AuthShell>
  )
}
