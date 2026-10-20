# Gestão da Psicologia

Sistema web em Google Apps Script para o serviço de psicologia hospitalar. Substitui a planilha
`2026_GERENCIAMENTO_PSICOLOGIA` (uma aba por mês, abas de residentes e compilados) por um cadastro
único de pacientes e casos, com o compilado mensal e anual gerado automaticamente.

## Situação

| Parte | Situação |
| --- | --- |
| Banco de dados (abas, setores, unidades, listas) | pronto |
| Acesso por e-mail Google, perfis coordenação e profissional | pronto |
| Pacientes: busca por prontuário ou nome, cadastro, alerta de duplicado | pronto |
| Cadastros da coordenação: profissionais, setores, unidades, listas | pronto |
| Casos: solicitação, avaliação, reavaliação, acompanhamento, desfecho | a fazer |
| Registro do dia: atendimentos paciente e família, atividades, reuniões | a fazer |
| Acompanhamento semanal: justificativa e conformidade | a fazer |
| Passagem de plantão | a fazer |
| Atividades gerenciais | a fazer |
| Painel do dia | a fazer |
| Compilado mensal, compilado de residência e estágio, exportação para planilha | a fazer |
| Importação do histórico de 2026 | a combinar |

## Como a planilha atual vira o sistema

| Na planilha atual | No sistema |
| --- | --- |
| Uma linha por paciente em cada aba mensal, copiada de um mês para o outro | Um **caso** por solicitação, que segue aberto até o desfecho |
| Blocos de linhas por setor | Campo **unidade** do caso; cada unidade pertence a um setor |
| Grade de dias com P e F | **Atendimentos**: data, paciente ou família, quantidade, profissional |
| Justificativa e C/NC por semana | **Semanas** do acompanhamento |
| Colunas de ficha de admissão, discussão de caso, visitas… | **Atividades** do caso |
| Tabela "Reuniões de equipe" por unidade | **Reuniões** |
| Atividades gerenciais no compilado | **Gerenciais** |
| Abas "– RESIDENTES" | Mesmo cadastro; o profissional tem categoria **residente** ou **estagiária** |
| Abas "COMPILADO" | Gerados pelo sistema a partir dos registros |

## Estrutura

```
src/
  appsscript.json   manifesto do Apps Script
  Config.js         tabelas do banco e valores iniciais (setores, unidades, listas)
  Regras.js         regras puras: datas, tempos, validações, busca (testadas no Node)
  Db.js             leitura e gravação das abas como tabelas
  Setup.js          função "configurar": cria e semeia o banco
  Main.js           doGet, controle de acesso, tratamento de erros
  Api.js            funções chamadas pela tela
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
7. Em Cadastros, inclua cada profissional com o e-mail Google que ela usa.

## Testes

```
npm test
```

Roda as regras e o servidor (configuração, banco, API) com os serviços do Google simulados em memória.
