import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <h1 className="mb-6 text-2xl font-semibold">Sign in</h1>
      <LoginForm />
    </main>
  );
}
