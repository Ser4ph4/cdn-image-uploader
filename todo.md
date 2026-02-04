# CDN Image Uploader - TODO

## Funcionalidades Principais

- [x] Interface de upload com drag-and-drop
- [x] Seleção de arquivo via input
- [x] Integração com GitHub API para commit/push
- [x] Geração automática de links CDN jsDelivr
- [x] Campo para armazenar token GitHub (localStorage)
- [x] Histórico de uploads com lista de imagens
- [x] Botão de copiar link CDN para área de transferência
- [x] Dashboard com gráficos Recharts
- [x] Preview de imagem antes e após upload
- [x] Validação de formatos de arquivo (jpg, png, gif, webp, svg)
- [x] Feedback visual de progresso durante upload
- [x] Feedback visual de progresso durante commit
- [x] Tratamento de erros robusto
- [x] Design elegante e refinado

## Componentes a Criar

- [x] UploadZone - Componente de drag-and-drop
- [x] ImagePreview - Preview da imagem (integrado no UploadZone)
- [x] UploadHistory - Lista de uploads
- [x] Dashboard - Gráficos e estatísticas
- [x] GitHubTokenInput - Input para token GitHub
- [x] UploadProgress - Indicador de progresso (integrado na página Home)

## Banco de Dados

- [x] Tabela de uploads (id, filename, url, cdnLink, fileSize, uploadedAt, userId)
- [x] Tabela de estatísticas (id, userId, totalUploads, totalSize, createdAt)

## Testes

- [x] Testes unitários para validação de arquivo
- [x] Testes para integração GitHub API
- [x] Testes para geração de link CDN

## Melhorias Futuras

- [ ] Suporte a múltiplos repositórios
- [ ] Configuração de branch customizável
- [ ] Exclusão de uploads
- [ ] Busca e filtro no histórico
- [ ] Temas escuro/claro
- [ ] Exportação de estatísticas
