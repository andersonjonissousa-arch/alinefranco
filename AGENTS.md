# Publicação e versionamento

- Toda publicação no Google Apps Script deve ser acompanhada de commit e push do código correspondente ao GitHub. Esta é uma instrução permanente do usuário.
- Execute os testes e `npm run empacotar` antes de publicar. Inclua fontes, testes, documentação e `dist/` no versionamento.
- Confira as alterações remotas antes do push. Preserve trabalho remoto e nunca use force push para substituir alterações de outras sessões.
- Quando houver divergência, envie o código publicado para uma branch identificável e informe a necessidade de integração, sem misturar silenciosamente alterações que não foram publicadas.
- Informe a versão do Apps Script, o commit e a branch enviados. Se o push falhar, registre explicitamente a pendência; publicação e sincronização são etapas separadas.
- Nunca adicione `.clasprc.json`, tokens OAuth, credenciais ou planilhas com dados de pacientes ao Git.

## Estado de sincronização

A versão 22 do Apps Script foi salva na branch `codex/appscript-v22`. A branch remota `claude/adoring-bell-q834ri` recebeu alterações independentes e precisa ser conciliada antes de uma próxima publicação que combine os dois trabalhos.
