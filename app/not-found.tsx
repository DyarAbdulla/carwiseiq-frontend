import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1117]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">404 - Page Not Found</h2>
        <p className="text-[#94a3b8] mb-6">The page you are looking for does not exist.</p>
        <Link href="/en">
          <Button className="bg-[#5B7FFF] hover:bg-[#5B7FFF]/90">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  )
}







