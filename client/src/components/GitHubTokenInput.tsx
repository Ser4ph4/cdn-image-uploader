import { useState, useEffect } from "react";
import { Eye, EyeOff, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GitHubTokenInputProps {
  onTokenChange: (token: string) => void;
  onRepositoryChange?: (owner: string, repo: string) => void;
  isValidating?: boolean;
}

export function GitHubTokenInput({ onTokenChange, onRepositoryChange, isValidating }: GitHubTokenInputProps) {
  const [token, setToken] = useState("");
  const [owner, setOwner] = useState("Ser4ph4");
  const [repo, setRepo] = useState("ser4ph4.github.io");
  const [showToken, setShowToken] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);

  // Carregar dados do localStorage ao montar
  useEffect(() => {
    const savedToken = localStorage.getItem("github_token");
    const savedOwner = localStorage.getItem("github_owner");
    const savedRepo = localStorage.getItem("github_repo");

    if (savedToken) {
      setToken(savedToken);
      setIsSaved(true);
    }
    if (savedOwner) setOwner(savedOwner);
    if (savedRepo) setRepo(savedRepo);
  }, []);

  const handleSave = async () => {
    if (!token.trim()) {
      setIsValid(false);
      setValidationMessage("Token não pode estar vazio");
      return;
    }

    if (!owner.trim() || !repo.trim()) {
      setIsValid(false);
      setValidationMessage("Owner e repositório são obrigatórios");
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

      if (!response.ok) {
        setIsValid(false);
        setValidationMessage("Token inválido ou expirado");
        return;
      }

      // Extrair scopes
      const scopesHeader = response.headers.get("x-oauth-scopes") || "";
      const scopesList = scopesHeader.split(", ").filter((s) => s);
      setScopes(scopesList);

      // Verificar permissões
      const hasRepoScope = scopesList.includes("repo") || scopesList.includes("public_repo");

      if (!hasRepoScope) {
        setIsValid(false);
        setValidationMessage(
          "⚠️ Token sem permissão 'repo'. Crie um novo token com escopo 'repo' em github.com/settings/tokens"
        );
        return;
      }

      // Testar acesso ao repositório
      const repoResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!repoResponse.ok) {
        setIsValid(false);
        setValidationMessage(`Repositório não encontrado: ${owner}/${repo}`);
        return;
      }

      // Sucesso!
      setIsValid(true);
      setValidationMessage("✅ Token e repositório validados com sucesso!");

      // Salvar no localStorage
      localStorage.setItem("github_token", token);
      localStorage.setItem("github_owner", owner);
      localStorage.setItem("github_repo", repo);

      setIsSaved(true);
      onTokenChange(token);
      onRepositoryChange?.(owner, repo);
    } catch (error) {
      setIsValid(false);
      setValidationMessage("Erro ao validar token");
    }
  };

  const handleClear = () => {
    setToken("");
    setOwner("Ser4ph4");
    setRepo("ser4ph4.github.io");
    setIsValid(null);
    setIsSaved(false);
    setValidationMessage("");
    setScopes([]);
    localStorage.removeItem("github_token");
    localStorage.removeItem("github_owner");
    localStorage.removeItem("github_repo");
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
          {" "}com escopo <code className="bg-muted px-1 rounded text-xs">repo</code>
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
            disabled={isValidating || isSaved}
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

      {/* Configuração do Repositório */}
      <div className="space-y-3 pt-2 border-t border-border">
        <Label className="text-sm font-medium">Repositório GitHub</Label>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="owner" className="text-xs text-muted-foreground mb-1 block">
              Owner
            </Label>
            <Input
              id="owner"
              value={owner}
              onChange={(e) => {
                setOwner(e.target.value);
                setIsValid(null);
              }}
              placeholder="seu-usuario"
              disabled={isValidating || isSaved}
              className="text-sm"
            />
          </div>

          <div>
            <Label htmlFor="repo" className="text-xs text-muted-foreground mb-1 block">
              Repositório
            </Label>
            <Input
              id="repo"
              value={repo}
              onChange={(e) => {
                setRepo(e.target.value);
                setIsValid(null);
              }}
              placeholder="nome-repo"
              disabled={isValidating || isSaved}
              className="text-sm"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Formato: <code className="bg-muted px-1 rounded">owner/repo</code> (ex: Ser4ph4/ser4ph4.github.io)
        </p>
      </div>

      {/* Mensagens de validação */}
      {validationMessage && (
        <div
          className={`flex items-start gap-2 text-sm p-3 rounded-lg ${
            isValid
              ? "bg-green-50 text-green-900 border border-green-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          {isValid ? (
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          <span>{validationMessage}</span>
        </div>
      )}

      {/* Scopes exibidos */}
      {scopes.length > 0 && (
        <div className="text-xs">
          <p className="text-muted-foreground mb-2">Permissões do token:</p>
          <div className="flex flex-wrap gap-1">
            {scopes.map((scope) => (
              <span
                key={scope}
                className="px-2 py-1 bg-primary/10 text-primary rounded text-xs"
              >
                {scope}
              </span>
            ))}
          </div>
        </div>
      )}

      {!isSaved && (
        <Button
          onClick={handleSave}
          disabled={!token.trim() || !owner.trim() || !repo.trim() || isValidating}
          className="w-full"
        >
          {isValidating ? "Validando..." : "Validar e Salvar"}
        </Button>
      )}
    </div>
  );
}
