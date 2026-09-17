import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BackToHomeLink } from "@/components/auth/back-to-home-link";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm space-y-3">
        <div className="flex items-center justify-start">
          <BackToHomeLink />
        </div>
        <Card accent="green" className="shadow-warm-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-heading">
              Account Created
            </CardTitle>
            <CardDescription className="text-xs">
              Welcome to VEDA SETU
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-ayush-green/30 bg-ayush-green/10 p-4 text-sm text-ayush-green font-medium">
              Account created successfully. You can now sign in.
            </div>
            <Button asChild variant="default" className="w-full">
              <Link href="/auth/login">Sign In to Portal</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
