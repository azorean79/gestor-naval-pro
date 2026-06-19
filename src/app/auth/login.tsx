import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // Simulação de login
    if (!email || !password) {
      setError("Preencha todos os campos.");
      return;
    }
    // TODO: Chamar API real
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form className="bg-white p-6 rounded shadow-md w-full max-w-sm" onSubmit={handleLogin}>
        <h2 className="text-xl font-bold mb-4">Login</h2>
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-2 p-2 border rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Senha"
          className="w-full mb-2 p-2 border rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Entrar</button>
        <div className="mt-2 text-sm">
          <a href="/auth/register" className="text-blue-600 hover:underline">Registar-se</a>
        </div>
      </form>
    </div>
  );
}
