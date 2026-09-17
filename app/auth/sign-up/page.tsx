import { SignUpForm } from "@/components/sign-up-form";
import { BackToHomeLink } from "@/components/auth/back-to-home-link";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm space-y-3">
        <div className="flex items-center justify-start">
          <BackToHomeLink />
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
