'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth, useUser, initiateGoogleSignIn } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Chrome } from 'lucide-react';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleGoogleSignIn = () => {
    initiateGoogleSignIn(auth);
  };

  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {/* You can add a loader here */}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to continue to FastFoodGo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={handleGoogleSignIn} className="w-full" variant="outline">
              <Chrome className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
