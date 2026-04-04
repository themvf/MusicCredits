import { SignUp } from '@clerk/nextjs'
import AuthShell from '@/components/AuthShell'

export default function SignUpPage() {
  return (
    <AuthShell
      title="Launch your artist growth engine"
      description="Create your account to start earning credits through real listening and get your tracks into a trusted creator loop."
    >
      <SignUp />
    </AuthShell>
  )
}
