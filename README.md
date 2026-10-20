# Gestão da Psicologia

Sistema web em Google Apps Script para o serviço de psicologia hospitalar: cadastro de pacientes,
casos da solicitação ao desfecho, atendimentos com prazo de retorno em dias úteis e o compilado
mensal e anual gerado automaticamente. Base de dados nova, começando do zero.

## Situação

| Parte | Situação |
| --- | --- |
| Banco de dados (abas, setores, unidades, listas, justificativas, feriados) | pronto |
| Acesso por e-mail Google, perfis coordenação e profissional | pronto |
| Pacientes: busca por prontuário ou nome, cadastro, alerta de duplicado | pronto |
| Casos: solicitação, avaliação, acompanhamento e desfecho | pronto |
| Atendimentos (paciente ou família) com o profissional do login e prazo da justificativa | pronto |
| Atividades assistenciais do caso | pronto |
| Painel do dia: atrasados e com prazo para hoje | pronto |
| Cadastros da coordenação: profissionais, justificativas e prazos, setores, unidades, listas, feriados | pronto |
| Reuniões de equipe e atividades gerenciais | a fazer |
| Compilado mensal e anual, separando empresa de residência e estágio | a fazer |

## Regras principais

- **Um caso por solicitação**, aberto até o desfecho. O mesmo paciente não pode ter dois casos abertos.
- **Prazo de retorno:** cada justificativa de acompanhamento tem um prazo em dias úteis. Depois de cada
  contato (avaliação ou atendimento), o próximo atendimento tem que acontecer dentro desse prazo.
  Sábado, domingo e os feriados cadastrados não contam. Cada atendimento fica marcado como no prazo
  ou fora do prazo, e o caso mostra o próximo prazo e se está atrasado.
- **Sem prazo** quando a necessidade de acompanhamento é "NÃO" ou "N / A", quando o caso está
  encerrado ou quando a justificativa ainda não tem prazo preenchido.
- **Profissional:** o atendimento já vem com quem está logado; dá para escolher outra pessoa.
- **Categoria:** profissional da empresa, residente ou estagiário. A categoria fica gravada em cada
  atendimento; só os da empresa entram nos números da empresa.

## Estrutura

```
src/
  appsscript.json   manifesto do Apps Script
  Config.js         tabelas do banco e valores iniciais (setores, unidades, listas, feriados)
  Regras.js         regras puras: datas, dias úteis, prazos, validações, busca (testadas no Node)
  Db.js             leitura e gravação das abas como tabelas
  Setup.js          função "configurar": cria e semeia o banco
  Main.js           doGet, controle de acesso, tratamento de erros
  Api.js            funções da tela: início, pacientes e cadastros
  Casos.js          casos, atendimentos, atividades e recálculo dos prazos
  ui/               tela (HTML, CSS e JavaScript, sem bibliotecas externas)
tests/              testes com Node, com os serviços do Google simulados
```

## Banco de dados

Uma planilha Google, uma aba por tabela, primeira linha com o nome das colunas. Tudo é gravado como
texto (datas em `AAAA-MM-DD`). As colunas de cada tabela estão em `src/Config.js` (`TABELAS`).
Não mude a ordem das colunas direto na planilha.

## Implantação

1. Instale o clasp e entre na conta Google que vai ser dona do sistema:
   `npm install -g @google/clasp` e `clasp login`.
2. Crie o projeto: `clasp create --type standalone --title "Gestão da Psicologia" --rootDir src`
   (ou copie `.clasp.json.example` para `.clasp.json` com o id de um projeto existente).
3. Envie o código: `clasp push`.
4. No editor do Apps Script, rode a função `configurar`. Ela cria a planilha do banco e cadastra
   quem rodou como coordenação. O endereço da planilha aparece no registro de execução.
5. Compartilhe a planilha do banco como **editor** com a equipe. O app roda com a conta de quem acessa.
6. Implante: Implantar > Nova implantação > App da Web, executar como **usuário que acessa o app**.
7. Em Cadastros: inclua cada profissional com o e-mail Google que usa, preencha o prazo em dias
   úteis de cada justificativa e confira os feriados (vêm só os nacionais de 2026 e 2027).

## Testes

```
npm test
```

Roda as regras e o servidor (configuração, banco, casos, atendimentos e prazos) com os serviços do
Google simulados em memória.
