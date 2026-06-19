"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { APP_CONFIG } from "@/lib/app-config";

export default function RegistarPage() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As passwords não coincidem.");
      return;
    }
    if (password.length < 8) {
      setError("A password deve ter pelo menos 8 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Ocorreu um erro ao criar a conta.");
        return;
      }

      router.push("/login?registered=1");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "70vh", display: "grid", placeItems: "center", px: 2 }}>
      <Paper elevation={8} sx={{ width: "100%", maxWidth: 480, borderRadius: 4, p: { xs: 3, md: 5 } }}>
        <Stack spacing={3} component="form" onSubmit={handleRegister}>
          <Stack spacing={1}>
            <Typography variant="overline" sx={{ color: "#2563eb", fontWeight: 700 }}>
              {APP_CONFIG.name}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Criar conta
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Preenche os campos abaixo para registar a tua conta.
            </Typography>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Nome"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            fullWidth
          />
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            helperText="Mínimo 8 caracteres"
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowPassword((current) => !current)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Confirmar password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            sx={{ py: 1.5, textTransform: "none", fontWeight: 700, borderRadius: 999 }}
          >
            {isSubmitting ? <CircularProgress size={22} color="inherit" /> : "Registar"}
          </Button>

          <Typography variant="body2" color="text.secondary" textAlign="center">
            Já tens conta?{" "}
            <Link href="/login" style={{ color: "#2563eb", fontWeight: 600 }}>
              Iniciar sessão
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
