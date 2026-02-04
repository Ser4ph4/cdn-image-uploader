import { useState, useEffect } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GitHubTokenInputProps {
  onTokenChange: (token: string) => void;
  isValidating?: boolean;
}

export function GitHubTokenInput({ onTokenChange, isValidating }: GitHubTokenInputProps) {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Carregar token do localStorage ao montar
  useEffect(() => {
    const savedToken = localStorage.getItem("github_token");
    if (savedToken) {
      setToken(savedToken);
      setIsSaved(true);
    }
  }, []);

  const handleSave = async () => {
    if (!token.trim()) {
      setIsValid(false);
      return;
    }

    // Validar token com GitHub API
    try {
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      const isTokenValid = response.ok;
      setIsValid(isTokenValid);

      if (isTokenValid) {
        localStorage.setItem("github_token", token);
        setIsSaved(true);
        onTokenChange(token);
      }
    } catch (error) {
      setIsValid(false);
    }
  };

  const handleClear = () => {
    setToken("");
    setIsValid(null);
    setIsSaved(false);
    localStorage.removeItem("github_token");
    onTokenChange("");
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div>
        <Label htmlFor="github-token" className="text-sm font-medium">
          Token de Acesso Pessoal do GitHub
        </Label>
        <p className="text-xs text-muted-foreground mt-1">
          Crie um token em{" "}
          <a
            href="https://github.com/settings/tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            github.com/settings/tokens
          </a>
          {" "}com permissão de escrita em repositórios
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="github-token"
            type={showToken ? "text" : "password"}
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              setIsValid(null);
            }}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="pr-10"
            disabled={isValidating}
          />
          <button
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            type="button"
          >
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {isSaved && (
          <Button
            onClick={handleClear}
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            Limpar
          </Button>
        )}
      </div>

      {isValid === false && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <X className="w-4 h-4" />
          Token inválido ou expirado
        </div>
      )}

      {isValid === true && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <Check className="w-4 h-4" />
          Token validado com sucesso
        </div>
      )}

      {!isSaved && (
        <Button
          onClick={handleSave}
          disabled={!token.trim() || isValidating}
          className="w-full"
        >
          {isValidating ? "Validando..." : "Validar e Salvar Token"}
        </Button>
      )}
    </div>
  );
}
