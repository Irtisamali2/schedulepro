import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, CheckCircle, Users } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';

export default function TeamForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/auth/forgot-password/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reset email');
      }

      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    forgotPasswordMutation.mutate(email);
  };

  if (submitted) {
    return (
      <div
        className="bg-gradient-to-br from-slate-100 to-blue-50"
        style={{ position: 'fixed', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <div className="flex items-center justify-center min-h-full px-4 py-8"
          style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
          <div className="w-full max-w-sm">
            <Card className="shadow-lg">
              <CardContent className="pt-8 pb-8 text-center px-6">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-9 w-9 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  If a team member account exists for <strong>{email}</strong>, we've sent a password reset link. Please check your inbox and spam folder.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setLocation('/team-login')}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Team Login
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-gradient-to-br from-slate-100 to-blue-50"
      style={{ position: 'fixed', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
    >
      <div className="flex items-center justify-center min-h-full px-4 py-8"
        style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        <div className="w-full max-w-sm">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
              <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                Enter your team member email and we'll send you a password reset link.
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your team member email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={forgotPasswordMutation.isPending || !email}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {forgotPasswordMutation.isPending ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <button
                  type="button"
                  onClick={() => setLocation('/team-login')}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 inline-flex items-center justify-center gap-1 mt-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Team Login
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
