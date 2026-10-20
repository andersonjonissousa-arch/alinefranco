# Gestão da Psicologia

Sistema web em Google Apps Script para o serviço de psicologia hospitalar: cadastro de pacientes,
admissões da entrada no hospital ao desfecho, indicador do 1º atendimento, atendimentos com prazo de
retorno em dias úteis e o compilado
mensal e anual gerado automaticamente. Base de dados nova, começando do zero.

## Situação

| Parte | Situação |
| --- | --- |
| Banco de dados (abas, setores, unidades, listas, justificativas, desfechos, feriados, parâmetros) | pronto |
| Acesso por e-mail Google, perfis coordenação e profissional | pronto |
| Pacientes: busca por prontuário ou nome, cadastro, alerta de duplicado | pronto |
| Admissões: entrada no hospital, solicitação, avaliação, acompanhamento e desfecho | pronto |
| Indicador do 1º atendimento em até 3 dias úteis da admissão (configurável) | pronto |
| Atendimentos ao paciente ou à família (com quantas pessoas), profissional do login, prazo de retorno | pronto |
| Retomada do acompanhamento na mesma admissão após desfecho psicológico | pronto |
| Atividades assistenciais | pronto |
| Painel do dia: aguardando 1º atendimento, atrasados e com prazo para hoje | pronto |
| Cadastros da coordenação | pronto |
| Reuniões de equipe e atividades gerenciais | a fazer |
| Compilado mensal e anual, separando empresa de residência e estágio | a fazer |

## Regras principais

- **Admissão = cada entrada do paciente no hospital.** Uma nova admissão só é aberta depois que a anterior
  foi encerrada por um desfecho de saída do hospital.
- **Desfechos** (configuráveis): ALTA, ÓBITO e TRANSFERÊNCIA encerram a admissão. SEM CONDIÇÕES
  CLÍNICAS E/OU SOCIAIS, ALTA PSICOLÓGICA e RECUSA encerram só o acompanhamento: se o paciente segue
  internado, o acompanhamento é retomado na mesma admissão e os prazos recomeçam na data da retomada.
- **1º atendimento (avaliação):** tem que acontecer em até 3 dias úteis da data de admissão no hospital
  (parâmetro editável). Resultado: no prazo, fora do prazo, em andamento ou não se aplica — quando o
  paciente teve desfecho dentro do prazo sem ter sido atendido, a admissão fica fora do indicador.
- **Prazo de retorno:** cada justificativa de acompanhamento tem um prazo em dias úteis. Depois de cada
  atendimento que conta, o próximo tem que acontecer dentro desse prazo. Sábado, domingo e os feriados
  cadastrados não contam. Sem prazo quando a necessidade de acompanhamento é "NÃO" ou "N / A" ou a
  justificativa não tem prazo preenchido.
- **Atendimento à família:** informa quantos familiares foram atendidos de uma vez. Só conta para os
  prazos (1º atendimento e retornos) quando o paciente estava impossibilitado de ser atendido.
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
  Admissoes.js      admissões, atendimentos, atividades, retomada e recálculo dos prazos
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
   úteis de cada justificativa, confira os desfechos, o prazo do 1º atendimento e os feriados
   (vêm só os nacionais de 2026 e 2027).

## Testes

```
npm test
```

Roda as regras e o servidor (configuração, banco, admissões, atendimentos e prazos) com os serviços do
Google simulados em memória.
