# Publicação e versionamento

- Toda publicação no Google Apps Script deve ser acompanhada de commit e push do código correspondente ao GitHub. Esta é uma instrução permanente do usuário.
- Execute os testes e `npm run empacotar` antes de publicar. Inclua fontes, testes, documentação e `dist/` no versionamento.
- Confira as alterações remotas antes do push. Preserve trabalho remoto e nunca use force push para substituir alterações de outras sessões.
- Quando houver divergência, envie o código publicado para uma branch identificável e informe a necessidade de integração, sem misturar silenciosamente alterações que não foram publicadas.
- Informe a versão do Apps Script, o commit e a branch enviados. Se o push falhar, registre explicitamente a pendência; publicação e sincronização são etapas separadas.
- Nunca adicione `.clasprc.json`, tokens OAuth, credenciais ou planilhas com dados de pacientes ao Git.

## Estado de sincronização

A versão 22 do Apps Script foi salva na branch `codex/appscript-v22`. Ela foi conciliada na branch `claude/adoring-bell-q834ri` com as otimizações de desempenho feitas lá em paralelo (leitura e gravação pela API do Google Planilhas, uma trava por operação, abertura com os dados embutidos e `medirDesempenho`). O cache de cadastros da versão 22 saiu na conciliação, porque a leitura em lote o tornou redundante. A publicação automática (`.github/workflows/publicar-apps-script.yml`) envia `claude/adoring-bell-q834ri` ao Apps Script a cada push.

A v27 enviada pela coordenação (patch `gestao-psicologia-v27.patch`) foi integrada em `claude/adoring-bell-q834ri` com os ajustes combinados: prazo da interconsulta em 1/2/3 dias úteis sem hora (o `configurar` converte uma única vez os bancos antigos, marcando `PRAZO_SOLICITACAO_EM_DIAS`), sem a seção "Necessidade de acompanhamento" no compilado e descrição da demanda corrigível depois do 1º atendimento.
