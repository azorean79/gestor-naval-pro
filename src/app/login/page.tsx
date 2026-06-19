"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { APP_CONFIG } from "@/lib/app-config";

function resolveCallbackUrl(rawCallbackUrl: string | null) {
  if (!rawCallbackUrl) return "/";

  const decodedCallbackUrl = decodeURIComponent(rawCallbackUrl);
  const normalizedCallbackUrl = decodedCallbackUrl.toLowerCase();

  if (
    normalizedCallbackUrl === "/" ||
    normalizedCallbackUrl === "/login" ||
    normalizedCallbackUrl === "/registar" ||
    normalizedCallbackUrl.startsWith("/login?") ||
    normalizedCallbackUrl.startsWith("/registar?")
  ) {
    return "/";
  }

  return decodedCallbackUrl;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const callbackUrl = React.useMemo(() => resolveCallbackUrl(searchParams.get("callbackUrl")), [searchParams]);
  const authError = searchParams.get("error");
  const registered = searchParams.get("registered");

  React.useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [callbackUrl, router, status]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou password incorretos.");
        return;
      }

      router.replace(callbackUrl);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <Box sx={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "70vh", display: "grid", placeItems: "center", px: 2 }}>
      <Paper elevation={8} sx={{ width: "100%", maxWidth: 480, borderRadius: 4, p: { xs: 3, md: 5 } }}>
        <Stack spacing={3} component="form" onSubmit={handleLogin} suppressHydrationWarning>
          <Stack spacing={1}>
            <Typography variant="overline" sx={{ color: "#2563eb", fontWeight: 700 }}>
              {APP_CONFIG.name}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Iniciar sessão
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Usa o teu email e password para entrar no sistema.
            </Typography>
          </Stack>

          {registered === "1" && (
            <Alert severity="success">Conta criada com sucesso. Já podes iniciar sessão.</Alert>
          )}

          {authError && (
            <Alert severity="error">Não foi possível iniciar sessão. Verifica as tuas credenciais.</Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            inputProps={{ suppressHydrationWarning: true }}
            fullWidth
          />

          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            inputProps={{ suppressHydrationWarning: true }}
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

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            suppressHydrationWarning
            sx={{ py: 1.5, textTransform: "none", fontWeight: 700, borderRadius: 999 }}
          >
            {isSubmitting ? <CircularProgress size={22} color="inherit" /> : "Entrar"}
          </Button>

          <Divider>ou</Divider>

          <Button
            component={Link}
            href="/registar"
            variant="outlined"
            size="large"
            suppressHydrationWarning
            sx={{ py: 1.5, textTransform: "none", fontWeight: 700, borderRadius: 999 }}
          >
            Registar
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}