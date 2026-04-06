export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] px-4 py-8">
      {children}
    </div>
  )
}
