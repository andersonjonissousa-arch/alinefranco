# Gestão da Psicologia

Sistema web em Google Apps Script para o serviço de psicologia hospitalar: cadastro de pacientes,
admissões da entrada no hospital ao desfecho, indicador do 1º atendimento, atendimentos com prazo de
retorno em dias úteis, registro de reuniões e atividades gerenciais, e o compilado mensal e anual
gerado automaticamente. Base de dados nova, começando do zero.

## O que tem

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
| Registro do dia: reuniões de equipe por unidade e atividades gerenciais | pronto |
| Painel do dia: aguardando 1º atendimento, atrasados e com prazo para hoje | pronto |
| Compilado mensal por unidade e anual por mês, por grupo de profissionais, com exportação e impressão | pronto |
| Cadastros da coordenação | pronto |

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
- **Categoria:** profissional da empresa, residente ou estagiário. A categoria e a unidade ficam
  gravadas em cada atendimento, atividade e reunião.

## Compilado

- **Mensal, por unidade** ou **anual, por mês** (com filtro de setor ou unidade).
- **Profissionais:** todos, só da empresa, só residentes ou só estagiários. Atendimentos, retornos,
  atividades, reuniões e atividades gerenciais seguem esse filtro. Admissões, 1º atendimento e
  desfechos são do serviço todo (a admissão não pertence a uma categoria).
- **Seções:** atendimentos (pacientes, familiares atendidos, total de pessoas); admissões e suas
  distribuições (tipo, descrição e prioridade da solicitação, descrição e prioridade da demanda,
  necessidade de acompanhamento); 1º atendimento no prazo (com % e média de dias); retornos no prazo
  da justificativa; desfechos; atividades assistenciais; reuniões de equipe; atividades gerenciais.
- **Datas usadas:** atendimentos, atividades e reuniões pela data do registro; admissões e 1º
  atendimento pela data de admissão; desfechos pela data do desfecho.
- **Desfechos** vêm do histórico (`DESFECHOS_REGISTRADOS`): cada desfecho registrado conta, inclusive o
  que foi seguido de retomada. Um paciente com alta psicológica, retomada e depois alta conta duas vezes.
  Corrigir o desfecho (tipo ou data) corrige o registro; apagar o desfecho remove o registro.
- **Exportar para Google Planilhas** cria uma planilha nova no Drive de quem exportou. **Imprimir**
  usa o layout de impressão da própria tela.

## Estrutura

```
src/
  appsscript.json   manifesto do Apps Script
  Config.js         tabelas do banco e valores iniciais (setores, unidades, listas, feriados)
  Regras.js         regras puras: datas, dias úteis, prazos, validações, busca (testadas no Node)
  Indicadores.js    cálculo do compilado (puro, testado no Node)
  Db.js             leitura e gravação das abas como tabelas
  Setup.js          função "configurar": cria e semeia o banco
  Main.js           doGet, controle de acesso, tratamento de erros
  Api.js            funções da tela: início, pacientes e cadastros
  Admissoes.js      admissões, atendimentos, atividades, retomada e recálculo dos prazos
  Compilado.js      compilado, exportação, reuniões e atividades gerenciais
  ui/               tela (HTML, CSS e JavaScript, sem bibliotecas externas)
dist/               o mesmo código em 4 arquivos, para instalar copiando e colando (npm run empacotar)
tests/              testes com Node, com os serviços do Google simulados
```

## Banco de dados

Uma planilha Google, uma aba por tabela, primeira linha com o nome das colunas. Tudo é gravado como
texto (datas em `AAAA-MM-DD`). As colunas de cada tabela estão em `src/Config.js` (`TABELAS`).
Não mude a ordem das colunas direto na planilha.

## Instalação

Use a conta Google da coordenação ou do serviço, não uma conta pessoal do desenvolvedor: a planilha
com os dados dos pacientes fica no Drive dessa conta.

### Copiando e colando (sem instalar nada)

1. Em script.google.com, crie um **Novo projeto** e dê o nome "Gestão da Psicologia".
2. Em **Configurações do projeto** (engrenagem), marque **Mostrar o arquivo de manifesto
   "appsscript.json" no editor**. Abra `appsscript.json` e cole o conteúdo de `dist/appsscript.json`.
3. Abra o arquivo `Código.gs`, apague o que tem e cole o conteúdo de `dist/Codigo.gs`.
4. Crie três arquivos HTML (botão **+** > HTML) com estes nomes exatos, sem ".html":
   `ui/Index`, `ui/Estilo` e `ui/App`. Cole em cada um o conteúdo do arquivo de mesmo nome em `dist/ui/`.
5. Salve. Na barra de cima, escolha a função `configurar` e clique em **Executar**. Autorize o acesso.
   Ela cria a planilha "Gestão da Psicologia — Banco de dados" e cadastra quem rodou como coordenação.
6. Siga os passos de "Depois de instalar".

### Pelo clasp (linha de comando)

1. `npm install -g @google/clasp` e `clasp login`.
2. `clasp create --type standalone --title "Gestão da Psicologia" --rootDir src`
   (ou copie `.clasp.json.example` para `.clasp.json` com o id de um projeto existente).
3. `clasp push` e, no editor, rode a função `configurar`.

### Depois de instalar

1. **Implantar > Nova implantação > App da Web**: executar como **usuário que acessa o app**, acesso
   para **qualquer pessoa com conta Google**. O link gerado é o endereço do sistema.
2. Compartilhe a planilha do banco como **editor** com a equipe (o app grava com a conta de quem usa).
3. No sistema, em **Cadastros**: inclua cada profissional com o e-mail Google dela, preencha o prazo em
   dias úteis de cada justificativa, confira os desfechos, o prazo do 1º atendimento e os feriados
   (vêm só os nacionais de 2026 e 2027).

### Atualizar para uma versão nova

Cole de novo os arquivos de `dist/` (ou `clasp push`) e, em **Implantar > Gerenciar implantações**,
edite a implantação e escolha **Nova versão**. Rode `configurar` de novo: ela só acrescenta o que
falta e não apaga dados.

## Testes

```
npm test
```

Roda as regras, o compilado e o servidor (configuração, banco, admissões, atendimentos, prazos,
exportação e registro do dia) com os serviços do Google simulados em memória.
