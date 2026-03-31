import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, LogIn } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { isCapacitor } from '@/lib/capacitor-init';

export default function ClientLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
      // Clear any team member data when business owner logs in - they should have full access
      localStorage.removeItem('teamMemberSession');
      localStorage.removeItem('teamMemberContext');
      localStorage.removeItem('testingDomains');
      
      // Store client login info and redirect to client dashboard
      localStorage.setItem('clientUser', JSON.stringify(data.user));
      localStorage.setItem('clientData', JSON.stringify(data.client));
      console.log('Business owner login successful, cleared team data:', data);
      setLocation('/client-dashboard');
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        {!isCapacitor() && (
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        )}

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Client Login</CardTitle>
            <p className="text-gray-600">Access your business dashboard</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@businessemail.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
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
              <p className="text-sm text-gray-600 mb-2">
                Don't have an account yet?
              </p>
              <Button
                variant="outline"
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


      </div>
    </div>
  );
}