import { Buffer } from "buffer";

interface GitHubCommitOptions {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
  path: string;
  message: string;
  content: Buffer | string;
  author?: {
    name: string;
    email: string;
  };
}

interface GitHubCommitResponse {
  commit: {
    sha: string;
    url: string;
  };
  content: {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string;
    type: string;
  };
}

/**
 * Faz commit de um arquivo para o repositório GitHub
 */
export async function commitToGitHub(options: GitHubCommitOptions): Promise<GitHubCommitResponse> {
  const {
    token,
    owner,
    repo,
    branch = "main",
    path,
    message,
    content,
    author = {
      name: "CDN Image Uploader",
      email: "uploader@cdn-image.local",
    },
  } = options;

  // Converter conteúdo para base64
  const contentBase64 = typeof content === "string"
    ? Buffer.from(content).toString("base64")
    : content.toString("base64");

  // Primeiro, tentar obter o SHA do arquivo existente (se houver)
  let sha: string | undefined;
  try {
    const getResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (getResponse.ok) {
      const data = await getResponse.json() as { sha: string };
      sha = data.sha;
    }
  } catch (error) {
    console.log("File does not exist yet, creating new file");
  }

  // Fazer commit do arquivo
  const commitResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: contentBase64,
        branch,
        sha,
        author,
        committer: author,
      }),
    }
  );

  if (!commitResponse.ok) {
    const errorData = await commitResponse.json() as { message?: string };
    throw new Error(`GitHub API error: ${errorData.message || commitResponse.statusText}`);
  }

  return commitResponse.json() as Promise<GitHubCommitResponse>;
}

/**
 * Gera o link CDN do jsDelivr para um arquivo no GitHub
 */
export function generateCDNLink(owner: string, repo: string, branch: string, path: string): string {
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path}`;
}

/**
 * Valida o token do GitHub e retorna informações sobre permissões
 */
export async function validateGitHubToken(token: string): Promise<{
  valid: boolean;
  scopes: string[];
  message: string;
  username?: string;
}> {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      return {
        valid: false,
        scopes: [],
        message: "Token inválido ou expirado",
      };
    }

    const userData = await response.json() as { login: string };

    // Extrair scopes do header
    const scopesHeader = response.headers.get("x-oauth-scopes") || "";
    const scopes = scopesHeader.split(", ").filter((s) => s);

    // Verificar se tem permissão 'repo'
    const hasRepoScope = scopes.includes("repo") || scopes.includes("public_repo");

    if (!hasRepoScope) {
      return {
        valid: false,
        scopes,
        message: "Token não tem permissão de escrita em repositórios. Crie um novo token com escopo 'repo'",
        username: userData.login,
      };
    }

    return {
      valid: true,
      scopes,
      message: "Token validado com sucesso",
      username: userData.login,
    };
  } catch (error) {
    return {
      valid: false,
      scopes: [],
      message: "Erro ao validar token",
    };
  }
}

/**
 * Obtém informações do repositório
 */
export async function getRepositoryInfo(
  token: string,
  owner: string,
  repo: string
): Promise<{ defaultBranch: string; exists: boolean; isPrivate?: boolean }> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      return { defaultBranch: "main", exists: false };
    }

    const data = await response.json() as { 
      default_branch: string;
      private: boolean;
    };
    return { 
      defaultBranch: data.default_branch, 
      exists: true,
      isPrivate: data.private,
    };
  } catch (error) {
    return { defaultBranch: "main", exists: false };
  }
}

/**
 * Testa acesso de escrita ao repositório
 */
export async function testRepositoryAccess(
  token: string,
  owner: string,
  repo: string
): Promise<{ canWrite: boolean; message: string }> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      return {
        canWrite: false,
        message: "Repositório não encontrado ou sem acesso",
      };
    }

    const data = await response.json() as { 
      permissions?: { push: boolean };
      private: boolean;
    };

    if (data.permissions?.push === false) {
      return {
        canWrite: false,
        message: "Sem permissão de escrita neste repositório",
      };
    }

    return {
      canWrite: true,
      message: "Acesso de escrita confirmado",
    };
  } catch (error) {
    return {
      canWrite: false,
      message: "Erro ao verificar acesso",
    };
  }
}
