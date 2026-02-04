interface GitHubCommitOptions {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
  path: string;
  message: string;
  content: string;
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
      const data = (await getResponse.json()) as { sha: string };
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
        content,
        branch,
        sha,
        author,
        committer: author,
      }),
    }
  );

  if (!commitResponse.ok) {
    const errorData = (await commitResponse.json()) as { message?: string };
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
