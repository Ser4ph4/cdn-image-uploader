import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UploadZone } from "@/components/UploadZone";
import { GitHubTokenInput } from "@/components/GitHubTokenInput";
import { UploadHistory } from "@/components/UploadHistory";
import { UploadDashboard } from "@/components/UploadDashboard";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { commitToGitHub, generateCDNLink } from "@/lib/github";
import { toast } from "sonner";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState("");
  const [githubOwner, setGithubOwner] = useState("Ser4ph4");
  const [githubRepo, setGithubRepo] = useState("ser4ph4.github.io");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Queries
  const uploadsQuery = trpc.uploads.list.useQuery();
  const statsQuery = trpc.uploads.stats.useQuery();
  const createUploadMutation = trpc.uploads.create.useMutation();

  // Carregar dados do localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("github_token");
    const savedOwner = localStorage.getItem("github_owner");
    const savedRepo = localStorage.getItem("github_repo");

    if (savedToken) setGithubToken(savedToken);
    if (savedOwner) setGithubOwner(savedOwner);
    if (savedRepo) setGithubRepo(savedRepo);
  }, []);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearPreview = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !githubToken || !user) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 80));
      }, 200);

      // Ler arquivo como base64
      const fileBuffer = await selectedFile.arrayBuffer();
      const uint8Array = new Uint8Array(fileBuffer);
      const binaryString = String.fromCharCode.apply(null, Array.from(uint8Array));
      const base64 = btoa(binaryString);

      // Fazer commit no GitHub
      const timestamp = new Date().getTime();
      const filename = `${timestamp}-${selectedFile.name}`;
      const path = `images/${filename}`;

      const response = await commitToGitHub({
        token: githubToken,
        owner: githubOwner,
        repo: githubRepo,
        path,
        message: `Upload de imagem: ${selectedFile.name}`,
        content: base64,
      });

      setUploadProgress(85);

      // Gerar link CDN
      const cdnLink = generateCDNLink(githubOwner, githubRepo, "main", path);

      setUploadProgress(90);

      // Salvar no banco de dados
      await createUploadMutation.mutateAsync({
        filename,
        originalFilename: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        githubUrl: response.content.html_url,
        cdnLink,
      });

      setUploadProgress(100);
      clearInterval(progressInterval);

      // Sucesso
      toast.success("Imagem enviada com sucesso!");

      // Copiar link para clipboard
      navigator.clipboard.writeText(cdnLink);
      toast.success("Link CDN copiado para área de transferência!");

      // Limpar
      handleClearPreview();
      setUploadProgress(0);

      // Recarregar lista
      uploadsQuery.refetch();
      statsQuery.refetch();
    } catch (error) {
      console.error("Erro no upload:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao fazer upload: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50">
        <Card className="w-full max-w-md p-8 text-center shadow-elegant border-0">
          <div className="mb-6">
            <div className="text-5xl mb-4">📸</div>
          </div>
          <h1 className="text-3xl font-bold mb-2">CDN Image Uploader</h1>
          <p className="text-muted-foreground mb-8">
            Faça upload de imagens para seu repositório GitHub e gere links CDN automaticamente
          </p>
          <Button onClick={() => (window.location.href = getLoginUrl())} size="lg" className="w-full">
            Fazer Login com Manus
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container max-w-6xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-block mb-4">
            <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium text-primary">✨ Gerenciador de CDN</p>
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            CDN Image Uploader
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Faça upload elegante de imagens para seu repositório GitHub e gere links CDN automaticamente com um clique
          </p>
        </div>

        {/* Alerta se não houver token */}
        {!githubToken && (
          <Alert className="mb-8 border-amber-200 bg-amber-50 text-amber-900 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ⚙️ Configure seu token GitHub no painel lateral para começar a fazer uploads
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 rounded-lg p-1">
            <TabsTrigger value="upload" className="rounded-md transition-all">📤 Upload</TabsTrigger>
            <TabsTrigger value="history" className="rounded-md transition-all">📋 Histórico</TabsTrigger>
            <TabsTrigger value="dashboard" className="rounded-md transition-all">📊 Dashboard</TabsTrigger>
          </TabsList>

          {/* Tab: Upload */}
          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Zona de Upload */}
              <div className="lg:col-span-2">
                <Card className="p-8 shadow-elegant border-0">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-lg">📷</span>
                    </div>
                    <h2 className="text-2xl font-bold">Fazer Upload de Imagem</h2>
                  </div>

                  {preview ? (
                    <div className="space-y-6">
                      <UploadZone
                        onFileSelect={handleFileSelect}
                        isLoading={isUploading}
                        preview={preview}
                        onClearPreview={handleClearPreview}
                      />

                      {/* Barra de progresso */}
                      {isUploading && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Enviando...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleUpload}
                        disabled={isUploading || !githubToken}
                        size="lg"
                        className="w-full"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          "Fazer Upload"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <UploadZone
                      onFileSelect={handleFileSelect}
                      isLoading={isUploading}
                    />
                  )}
                </Card>
              </div>

              {/* Configuração GitHub */}
              <div>
                <div className="sticky top-8">
                  <GitHubTokenInput
                    onTokenChange={setGithubToken}
                    onRepositoryChange={(owner, repo) => {
                      setGithubOwner(owner);
                      setGithubRepo(repo);
                    }}
                    isValidating={isUploading}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="history">
            <Card className="p-8 shadow-elegant border-0">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">📋</span>
                </div>
                <h2 className="text-2xl font-bold">Histórico de Uploads</h2>
              </div>
              <UploadHistory
                uploads={uploadsQuery.data || []}
                isLoading={uploadsQuery.isLoading}
              />
            </Card>
          </TabsContent>

          {/* Tab: Dashboard */}
          <TabsContent value="dashboard">
            <UploadDashboard
              uploads={uploadsQuery.data || []}
              stats={statsQuery.data}
              isLoading={uploadsQuery.isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
