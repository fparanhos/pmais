import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center mb-8">
        <Image
          src="/brand/logo.png"
          alt="Pmais"
          width={140}
          height={79}
          priority
        />
        <div className="mt-3 text-xs font-bold tracking-widest uppercase text-muted-foreground">
          Controle financeiro de eventos
        </div>
      </div>
      <LoginForm />
    </div>
  );
}
