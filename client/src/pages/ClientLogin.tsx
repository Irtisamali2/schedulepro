import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { isCapacitor } from '@/lib/capacitor-init';

export default function ClientLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch('/api/auth/client-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      localStorage.removeItem('testingDomains');

      // Team member login — store session and go to team dashboard
      if (data.userType === 'TEAM_MEMBER' && data.teamMember) {
        localStorage.removeItem('clientUser');
        localStorage.removeItem('clientData');
        localStorage.setItem('teamMemberSession', JSON.stringify({
          teamMember: data.teamMember,
          client: data.client || null,
          loginTime: new Date().toISOString(),
        }));
        setLocation('/team-dashboard');
        return;
      }

      // Business owner login
      localStorage.removeItem('teamMemberSession');
      localStorage.removeItem('teamMemberContext');
      localStorage.setItem('clientUser', JSON.stringify(data.user));
      localStorage.setItem('clientData', JSON.stringify(data.client));
      setLocation('/client-dashboard');
    },
    onError: (error: Error) => {
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md flex flex-col gap-4">
        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">Client Login</CardTitle>
            <p className="text-gray-600 text-sm">Access your business dashboard</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@businessemail.com"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                <LogIn className="h-4 w-4 mr-2" />
                {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
              </Button>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setLocation('/forgot-password')}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-gray-600">
                Don't have an account yet?
              </p>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setLocation('/onboarding')}
              >
                Start Free Trial
              </Button>

              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  Team member?
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setLocation('/team-login')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Team Member Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500 flex flex-wrap justify-center gap-1">
          <span>By signing in, you agree to our</span>
          <Link href="/terms-and-conditions">
            <span className="text-blue-600 hover:underline cursor-pointer">Terms</span>
          </Link>
          <span>,</span>
          <Link href="/privacy-policy">
            <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span>
          </Link>
          <span>&amp;</span>
          <Link href="/eula">
            <span className="text-blue-600 hover:underline cursor-pointer">EULA</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
