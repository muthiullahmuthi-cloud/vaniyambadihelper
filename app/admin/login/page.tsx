import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-sm mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Admin Login</h1>
        <Suspense fallback={<div className="text-center text-sm text-gray-400 py-4">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
