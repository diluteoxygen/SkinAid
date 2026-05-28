"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Activity, Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to login. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4" style={{ background: 'var(--background)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="squircle w-full max-w-[400px] p-8 overflow-hidden relative"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--glass-shadow)',
        }}
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-4"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>SkinAid Admin</h1>
          <p className="text-[14px] mt-2 text-center" style={{ color: 'var(--text-secondary)' }}>
            Sign in to access the deployment dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg flex items-start gap-3" style={{ background: 'color-mix(in srgb, var(--danger) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)' }}>
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
            <p className="text-[13px] leading-tight" style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-[10px] text-[14px] transition-all outline-none"
                style={{
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border-secondary)',
                  color: 'var(--text-primary)',
                }}
                placeholder="admin@skinaid.com"
                autoComplete="email"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-[10px] text-[14px] transition-all outline-none"
                style={{
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border-secondary)',
                  color: 'var(--text-primary)',
                }}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-2.5 rounded-[10px] text-[14px] font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-text)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
