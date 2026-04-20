import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-start mb-8 lg:hidden">
        <Image
          src="/brand/logo.png"
          alt="Pmais"
          width={140}
          height={79}
          priority
        />
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">Entrar</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Use suas credenciais da Pmais.
        </p>
      </div>
      <LoginForm />
      <p className="mt-8 text-xs text-muted-foreground text-center">
        v0.1 · em construção
      </p>
    </div>
  );
}
