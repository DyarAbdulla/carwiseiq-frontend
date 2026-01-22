"use client"


export const runtime = 'edge';
import { useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PrivacyPage() {
  const locale = useLocale()

  return (
    <div className="min-h-[calc(100vh-200px)] p-6 bg-[#0f1117]">
      <div className="max-w-4xl mx-auto">
        <Card className="border-[#2a2d3a] bg-[#1a1d29] text-white">
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-[#94a3b8] text-sm">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
              <p className="text-[#94a3b8] leading-relaxed mb-2">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-[#94a3b8] space-y-2 ml-4">
                <li>Account information (name, email address, password)</li>
                <li>Profile information (phone number, location)</li>
                <li>Listing information (car details, photos, pricing)</li>
                <li>Communication data (messages between users)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
              <p className="text-[#94a3b8] leading-relaxed mb-2">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-[#94a3b8] space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze trends and usage</li>
                <li>Detect, prevent, and address technical issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Information Sharing</h2>
              <p className="text-[#94a3b8] leading-relaxed mb-2">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-[#94a3b8] space-y-2 ml-4">
                <li>With your consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
                <li>With service providers who assist us in operating our platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Your Rights (GDPR)</h2>
              <p className="text-[#94a3b8] leading-relaxed mb-2">
                If you are located in the European Economic Area, you have certain data protection rights:
              </p>
              <ul className="list-disc list-inside text-[#94a3b8] space-y-2 ml-4">
                <li>The right to access your personal data</li>
                <li>The right to rectify inaccurate data</li>
                <li>The right to erasure ("right to be forgotten")</li>
                <li>The right to restrict processing</li>
                <li>The right to data portability</li>
                <li>The right to object to processing</li>
              </ul>
              <p className="text-[#94a3b8] leading-relaxed mt-4">
                You can exercise these rights by accessing your profile settings or contacting us directly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Cookies</h2>
              <p className="text-[#94a3b8] leading-relaxed mb-2">
                We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
              <p className="text-[#94a3b8] leading-relaxed">
                Types of cookies we use:
              </p>
              <ul className="list-disc list-inside text-[#94a3b8] space-y-2 ml-4">
                <li><strong>Essential cookies:</strong> Required for the website to function</li>
                <li><strong>Analytics cookies:</strong> Help us understand how visitors use our site</li>
                <li><strong>Marketing cookies:</strong> Used to deliver relevant advertisements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Data Retention</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Children's Privacy</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                Our service is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Changes to This Policy</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
              <p className="text-[#94a3b8] leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us through our support channels or visit your profile settings to manage your privacy preferences.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
