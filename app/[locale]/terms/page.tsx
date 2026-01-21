"use client"

import { useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TermsPage() {
  const locale = useLocale()

  return (
    <div className="min-h-[calc(100vh-200px)] p-6 bg-[#0f1117]">
      <div className="max-w-4xl mx-auto">
        <Card className="border-[#2a2d3a] bg-[#1a1d29] text-white">
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-[#94a3b8] text-sm">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                By accessing and using this Car Price Predictor service, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Use License</h2>
              <p className="text-[#94a3b8] leading-relaxed mb-2">
                Permission is granted to temporarily use this service for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-[#94a3b8] space-y-2 ml-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on the website</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
              <p className="text-[#94a3b8] leading-relaxed mb-2">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Content</h2>
              <p className="text-[#94a3b8] leading-relaxed mb-2">
                Our service allows you to post listings, comments, and other content. You retain ownership of any intellectual property rights that you hold in that content. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and distribute your content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Prohibited Uses</h2>
              <p className="text-[#94a3b8] leading-relaxed mb-2">
                You may not use our service:
              </p>
              <ul className="list-disc list-inside text-[#94a3b8] space-y-2 ml-4">
                <li>In any way that violates any applicable law or regulation</li>
                <li>To transmit any malicious code or viruses</li>
                <li>To impersonate or attempt to impersonate another user</li>
                <li>To engage in any automated use of the system</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Disclaimer</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                The materials on this website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Limitations</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Revisions</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                We may revise these terms of service at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Contact Information</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                If you have any questions about these Terms of Service, please contact us through our support channels.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
