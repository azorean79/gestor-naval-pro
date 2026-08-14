"use client";

import * as React from "react";
import { Suspense } from "react";
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
    normalizedCallbackUrl.startsWith("/login?")
  ) {
    return "/";
  }

  return decodedCallbackUrl;
}

interface Collaborator {
  id: number;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}><CircularProgress /></Box>}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  // Collaborators List State
  const [collaborators, setCollaborators] = React.useState<Collaborator[]>([]);
  const [selectedColab, setSelectedColab] = React.useState<Collaborator | null>(null);
  const [usePasswordLogin, setUsePasswordLogin] = React.useState(false);
  const [isLoadingColabs, setIsLoadingColabs] = React.useState(true);

  // Staff Standard Login State
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  // General State
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const callbackUrl = React.useMemo(() => resolveCallbackUrl(searchParams.get("callbackUrl")), [searchParams]);
  const authError = searchParams.get("error");

  // Load collaborators on mount
  React.useEffect(() => {
    async function loadCollaborators() {
      try {
        const res = await fetch("/api/auth/collaborators");
        const data = await res.json();
        if (Array.isArray(data.users)) {
          setCollaborators(data.users);
          if (data.users.length > 0) {
            setSelectedColab(data.users[0]);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar colaboradores:", err);
      } finally {
        setIsLoadingColabs(false);
      }
    }
    loadCollaborators();
  }, []);

  React.useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [callbackUrl, router, status]);

  const handleStaffLogin = async (e: React.FormEvent) => {
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

  const handlePasswordlessLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColab) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        loginType: "passwordless",
        userId: String(selectedColab.id),
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("Não foi possível iniciar sessão.");
        return;
      }

      router.replace(callbackUrl);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || (isLoadingColabs && collaborators.length === 0)) {
    return (
      <Box sx={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "70vh", display: "grid", placeItems: "center", px: 2 }}>
      <Paper elevation={8} sx={{ width: "100%", maxWidth: 450, borderRadius: 6, p: { xs: 3, md: 5 } }}>
        <Stack spacing={4} suppressHydrationWarning>
          <Stack spacing={1} alignItems="center" textAlign="center">
            <Typography variant="overline" sx={{ color: "#2563eb", fontWeight: 800, letterSpacing: 1.5 }}>
              {APP_CONFIG.name}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.03em" }}>
              Iniciar sessão
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Selecione o seu perfil para aceder ao Gestor Naval Pro.
            </Typography>
          </Stack>

          {authError && (
            <Alert severity="error">Não foi possível iniciar sessão. Tente novamente.</Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          {/* Windows-like Passwordless Login Mode */}
          {!usePasswordLogin ? (
            <Stack spacing={3} alignItems="center" component="form" onSubmit={handlePasswordlessLogin}>
              {/* User Avatar Circle */}
              <Box
                sx={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  fontWeight: 800,
                  boxShadow: "0 10px 20px rgba(37, 99, 235, 0.15)",
                  border: "3px solid white",
                  outline: "2px solid rgba(37, 99, 235, 0.2)",
                  backgroundImage: selectedColab?.image ? `url(${selectedColab.image})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  mb: 1
                }}
              >
                {!selectedColab?.image && (selectedColab?.name ? selectedColab.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "U")}
              </Box>

              <Stack spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {selectedColab?.name || selectedColab?.email || "Selecionar Utilizador"}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  {selectedColab?.role === "ADMIN" ? "⚙️ Administrador" : "🔧 Colaborador"}
                </Typography>
              </Stack>

              {/* Dropdown User Selector */}
              <TextField
                select
                fullWidth
                label="Escolher Conta"
                value={selectedColab?.id || ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const colab = collaborators.find(c => c.id === id);
                  if (colab) setSelectedColab(colab);
                }}
                SelectProps={{ native: true }}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                  }
                }}
              >
                {collaborators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.email} ({c.role === "ADMIN" ? "Admin" : "Técnico"})
                  </option>
                ))}
              </TextField>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isSubmitting || !selectedColab}
                sx={{
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 4,
                  fontSize: 16,
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)"
                }}
              >
                {isSubmitting ? <CircularProgress size={22} color="inherit" /> : "Entrar"}
              </Button>

              <Button
                variant="text"
                onClick={() => setUsePasswordLogin(true)}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.85rem", color: "text.secondary" }}
              >
                Entrar com Email e Password
              </Button>
            </Stack>
          ) : (
            /* Classic Password Login Mode */
            <Stack spacing={3} component="form" onSubmit={handleStaffLogin}>
              <TextField
                label="Endereço de Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                fullWidth
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
              />

              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                fullWidth
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
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
                sx={{
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 4,
                  fontSize: 16,
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)"
                }}
              >
                {isSubmitting ? <CircularProgress size={22} color="inherit" /> : "Entrar com Senha"}
              </Button>

              <Button
                variant="text"
                onClick={() => setUsePasswordLogin(false)}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.85rem", color: "primary.main" }}
              >
                Voltar à Seleção (Sem Password)
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}