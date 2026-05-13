import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Users, LogIn, Eye, EyeOff } from "lucide-react";

export default function TeamLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/team-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.teamMember) {
        const sessionData = {
          teamMember: data.teamMember,
          client: data.client || null,
          loginTime: new Date().toISOString()
        };

        localStorage.setItem("teamMemberSession", JSON.stringify(sessionData));

        toast({
          title: "Login successful",
          description: `Welcome back, ${data.teamMember.name}!`,
        });

        setTimeout(() => {
          setLocation("/team-dashboard");
        }, 100);
      } else {
        toast({
          title: "Login failed",
          description: "Invalid response from server.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your email and password and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 px-4 py-8">
      <div className="w-full max-w-md flex flex-col gap-4">
        <Card>
          <CardHeader className="space-y-1 text-center pb-4">
            <div className="flex justify-center mb-3">
              <div className="h-14 w-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Users className="h-7 w-7 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Team Member Login</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Enter your team member credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                disabled={isLoading || !email || !password}
              >
                <LogIn className="h-4 w-4 mr-2" />
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setLocation("/team-forgot-password")}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t text-center">
              <p className="text-sm text-gray-600">
                Business owner?{" "}
                <button
                  onClick={() => setLocation("/client-login")}
                  className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  Sign in here
                </button>
              </p>
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
