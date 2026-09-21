//app/sign-in/_components/signinpage.tsx
"use client"
import React, { useState } from 'react';
import { User, Lock, EyeOff, Eye, Loader } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import app from '@/app.json'
import { useRouter } from 'next/navigation';
import { apiService } from '@/app/_utils/apiService';

const SignInPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!username || !password) {
      setToastMessage("Username and Password are required.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
      setLoading(false);
      return;
    }

    try {
      const data = await apiService.login({ username, password });
      // backend throws on failure — reaching here means login succeeded
      router.push("/dashboard/demographic");
    } catch (error: any) {
      if (error.code === "CLINIC_INACTIVE") {
        setToastMessage("This clinic account has been deactivated. Please contact support.");
      } else if (error.status === 401) {
        setToastMessage("Incorrect username or password. Please try again.");
      } else {
        setToastMessage(error.message || "Login failed. Please try again.");
      }
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  }

  return (
    <section className="bg-primary min-h-screen flex items-center justify-center ">
      <Card className="w-full h-full max-w-md shadow-xl border-none py-8 gap-0">

        <CardContent className='px-12 py-8'>
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="name@example.com"
                  className="pl-10 h-12 shadow-md shadow-black/10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>

              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12 shadow-md shadow-black/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {/* 5. Add the toggle button */}
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute cursor-pointer right-3 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {showErrorToast && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                </svg>
                {toastMessage}
              </div>
            )}
            <Button type="submit" className="w-full text-md py-6 mt-3 cursor-pointer">
              Sign In
              {loading && <Loader className='animate-spin' />}
            </Button>
          </form>
        </CardContent>
        <CardFooter className='flex w-fit m-auto gap-2 text-primary font-bold'>
          <a href="tel:+923041111079" className="hover:underline">Contact Us</a>
          <span>/</span>
          <span>Version {app.version}</span>
        </CardFooter>
      </Card>
    </section>
  );
};

export default SignInPage;
