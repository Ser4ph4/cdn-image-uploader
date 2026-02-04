import { useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Upload {
  id: number;
  originalFilename: string;
  fileSize: number;
  cdnLink: string;
  uploadedAt: Date;
  mimeType: string;
}

interface UploadStats {
  totalUploads: number;
  totalSize: number;
}

interface UploadDashboardProps {
  uploads: Upload[];
  stats: UploadStats | null | undefined;
  isLoading?: boolean;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function UploadDashboard({ uploads, stats, isLoading }: UploadDashboardProps) {
  const chartData = useMemo(() => {
    // Dados por dia
    const dailyData: Record<string, { date: string; count: number; size: number }> = {};

    uploads.forEach((upload) => {
      const date = new Date(upload.uploadedAt).toLocaleDateString("pt-BR");
      if (!dailyData[date]) {
        dailyData[date] = { date, count: 0, size: 0 };
      }
      dailyData[date].count += 1;
      dailyData[date].size += upload.fileSize;
    });

    // Dados por tipo de arquivo
    const typeData: Record<string, { type: string; count: number }> = {};
    uploads.forEach((upload) => {
      const type = upload.mimeType.split("/")[1] || "outro";
      if (!typeData[type]) {
        typeData[type] = { type, count: 0 };
      }
      typeData[type].count += 1;
    });

    return {
      daily: Object.values(dailyData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      types: Object.values(typeData),
    };
  }, [uploads]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Total de Uploads</p>
          <p className="text-3xl font-bold">{stats?.totalUploads || 0}</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Tamanho Total</p>
          <p className="text-3xl font-bold">{formatBytes(stats?.totalSize || 0)}</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Último Upload</p>
          <p className="text-sm font-medium">
            {uploads.length > 0
              ? formatDistanceToNow(new Date(uploads[uploads.length - 1].uploadedAt), {
                  addSuffix: true,
                  locale: ptBR,
                })
              : "Nenhum"}
          </p>
        </Card>
      </div>

      {/* Gráficos */}
      {uploads.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Uploads por Dia */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Uploads por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  name="Quantidade"
                  dot={{ fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Tamanho por Dia */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Tamanho Total por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatBytes(value as number)} />
                <Legend />
                <Bar dataKey="size" fill="#10b981" name="Tamanho (bytes)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Distribuição por Tipo */}
          {chartData.types.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Distribuição por Tipo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.types}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, count }) => `${type} (${count})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {chartData.types.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
