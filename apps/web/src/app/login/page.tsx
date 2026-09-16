'use client'

import { useState } from 'react'
import { sendOtp, verifyOtp } from './actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  async function handleSendOtp(formData: FormData) {
    setError('')
    const res = await sendOtp(formData)
    if (res?.error) {
      setError(res.error)
    } else if (res?.success) {
      setStep('code')
      setPhone(res.phone)
    }
  }

  async function handleVerifyOtp(formData: FormData) {
    setError('')
    const res = await verifyOtp(formData)
    if (res?.error) {
      setError(res.error)
    }
  }

  // Demo Mode Autofill
  function triggerDemoMode() {
    setPhone('+15555555555')
    const formData = new FormData()
    formData.append('phone', '+15555555555')
    handleSendOtp(formData)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-black">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">BeforeWeDate</CardTitle>
          <CardDescription>
            {step === 'phone' ? 'Enter your phone number to sign in or create an account.' : 'Enter the verification code sent to your phone.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' ? (
            <form action={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  type="tel" 
                  placeholder="+1234567890" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required 
                />
              </div>
              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
              <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white">Continue</Button>
            </form>
          ) : (
            <form action={handleVerifyOtp} className="space-y-4">
              <input type="hidden" name="phone" value={phone} />
              <div className="space-y-2">
                <Label htmlFor="token">Verification Code</Label>
                <Input 
                  id="token" 
                  name="token" 
                  type="text" 
                  placeholder="123456" 
                  defaultValue={phone === '+15555555555' ? '123456' : ''}
                  required 
                />
                {phone === '+15555555555' && (
                  <p className="text-xs text-green-600 font-semibold mt-1">Demo code auto-filled!</p>
                )}
              </div>
              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
              <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white">Verify Code</Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep('phone'); setPhone(''); }}>
                Back
              </Button>
            </form>
          )}
        </CardContent>
        {step === 'phone' && (
          <CardFooter className="bg-gray-50 flex-col items-center p-6 rounded-b-xl border-t">
             <div className="text-center space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Hackathon Judges</p>
                <Button variant="outline" className="w-full border-black hover:bg-gray-100" onClick={triggerDemoMode}>
                  🪄 Try Demo Mode
                </Button>
             </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
