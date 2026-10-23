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
| Admissões: identificação de cada entrada no hospital e histórico de internações | pronto |
| Indicador do 1º atendimento em até 3 dias úteis da admissão (configurável) | pronto |
| Atendimentos ao paciente ou à família (com quantas pessoas), profissional do login, prazo de retorno | pronto |
| Retomada do acompanhamento na mesma admissão após desfecho psicológico | pronto |
| Atividades assistenciais | pronto |
| Registro do dia: reuniões de equipe por unidade e atividades gerenciais | pronto |
| Início: indicadores do dia e lista "Para atender hoje" | pronto |
| Gestão: pacientes por setor e unidade, interconsultas e os três prazos de cada paciente | pronto |
| Compilado mensal por unidade e anual por mês, por grupo de profissionais, com exportação e impressão | pronto |
| Cadastros da coordenação | pronto |

## Fluxo de uso

1. **Pacientes:** cadastre nome e prontuário uma única vez. O cadastro pode ser reutilizado em novas internações.
2. **Admissões > Nova admissão:** selecione o paciente e registre a data de entrada, unidade e observações da entrada. Ao salvar, a internação recebe seu próprio ID. Essa tela também permite corrigir os dados da entrada e consultar internações anteriores.
3. **Atendimentos:** encontre as internações ativas por paciente, setor ou unidade, incluindo quem aguarda o primeiro atendimento. A marca **Admitido hoje** se refere à data da entrada no hospital, não ao dia em que o registro foi digitado.
4. Na internação escolhida, salve os **Dados do acompanhamento** (demanda e necessidade), escolha a justificativa ao registrar o primeiro atendimento ou os seguintes e lance atividades assistenciais. Cada registro continua ligado ao mesmo ID da admissão.
5. Registre o **Desfecho da admissão** na tela Atendimentos. Alta hospitalar, óbito e transferência encerram a internação. Um desfecho psicológico permite retomar o acompanhamento na mesma admissão quando o paciente permanece internado.
6. Se o paciente voltar ao hospital depois de uma saída, abra uma **nova admissão**. Os atendimentos e desfechos anteriores continuam no histórico da internação original, acessível em Admissões.

Início e Gestão abrem diretamente a tela Atendimentos ao selecionar um paciente. Reuniões de equipe e atividades gerenciais continuam em Registro do dia. Ao acessar o sistema atualizado, a aba INTERCONSULTAS é criada automaticamente. Solicitações antigas são incorporadas uma única vez, sem apagar as colunas ou registros existentes.

## Regras principais

- **Admissão = cada entrada do paciente no hospital.** Uma nova admissão só é aberta depois que a anterior
  foi encerrada por um desfecho de saída do hospital.
- **Desfechos** (configuráveis): ALTA, ÓBITO e TRANSFERÊNCIA encerram a admissão. SEM CONDIÇÕES
  CLÍNICAS E/OU SOCIAIS, ALTA PSICOLÓGICA e RECUSA encerram só o acompanhamento: se o paciente segue
  internado, o acompanhamento é retomado na mesma admissão e os prazos recomeçam na data da retomada.
- **1º atendimento (avaliação):** tem que acontecer em até 3 dias úteis da data de admissão no hospital
  (parâmetro editável). Resultado: no prazo, fora do prazo, em andamento ou não se aplica — quando o
  paciente teve desfecho dentro do prazo sem ter sido atendido, a admissão fica fora do indicador.
- **Prazo de retorno:** cada justificativa de acompanhamento tem um prazo em dias úteis (pela prioridade). Depois de cada
  atendimento que conta, o próximo tem que acontecer dentro desse prazo. Sábado, domingo e os feriados
  cadastrados não contam. Sem prazo quando a necessidade de acompanhamento é "NÃO" ou "N / A" ou a
  justificativa não tem prazo preenchido.
- **Atendimento à família:** informa quantos familiares foram atendidos de uma vez. Só conta para os
  prazos (1º atendimento e retornos) quando o paciente estava impossibilitado de ser atendido.
- **Matriz de atendimento (solicitação):** cada motivo da solicitação tem uma prioridade (ALTA 24h,
  MODERADA 48h, BAIXA 72h). Cada solicitação é registrada em **Atendimentos > Interconsultas > Nova interconsulta**, a qualquer momento da internação. A resposta vinculada deve acontecer dentro
  desse prazo, em **horas úteis** (por isso a solicitação e o atendimento têm hora; sábados, domingos e feriados cadastrados não contam). Vale para os
  tipos de solicitação marcados em Parâmetros (de início, só EQUIPE). Solicitação para o paciente é
  respondida por atendimento ao paciente, ou à família com o paciente impossibilitado; solicitação para
  um familiar (com nome e parentesco) é respondida por qualquer atendimento. Motivo sem prioridade
  (TRIAGEM PSICOLÓGICA, REABILITA SEPSE) fica sem prazo até a coordenação definir.
- **Matriz de seguimento:** cada justificativa tem uma prioridade de seguimento, e o prazo de retorno é o
  da prioridade: ALTA 2 dias úteis (3x por semana), MODERADA 3 (2x por semana), BAIXA 5 (1x por semana),
  MONITORAMENTO 10 (1x a cada 15 dias). Prazos, prioridades e ligações são editáveis em Cadastros.
- **Profissional:** o atendimento já vem com quem está logado; dá para escolher outra pessoa.
- **Categoria:** profissional da empresa, residente ou estagiário. A categoria e a unidade ficam
  gravadas em cada atendimento, atividade e reunião.

## Gestão

Menu **Gestão**, com três abas (todas com filtro de setor, unidade e paciente):

- **Pacientes por unidade:** os pacientes internados em acompanhamento, sem desfecho, agrupados por
  setor e unidade. Mostra a situação (aguardando 1º atendimento ou em acompanhamento), a justificativa
  com a prioridade e a frequência da matriz, o último atendimento e o próximo prazo. Dá para incluir
  quem teve desfecho psicológico e segue internado, e mostrar só os atrasados ou só quem tem prazo.
- **Interconsultas:** cada linha representa uma solicitação, com data, motivo, destinatário, prioridade, prazo e resposta próprios. A gestão inclui solicitações com e sem prazo (os tipos com prazo incluem, de início,
  tipo EQUIPE). Aguardando resposta (com o tempo que falta ou o atraso em horas) e respondidas no
  período escolhido (no prazo ou fora, com o tempo de resposta), com totais e % no prazo.
- **Prazos:** uma linha por paciente com os três prazos lado a lado: 1º atendimento (dias úteis da
  admissão), interconsulta (horas úteis pela prioridade do motivo) e retorno (dias úteis pela prioridade da
  justificativa).

A tela **Início** mostra os totais (em acompanhamento, aguardando 1º atendimento, interconsultas
pendentes, atrasados, vencem hoje), que levam à aba certa da Gestão, e a lista do que vence hoje ou
está atrasado.

## Compilado

- **Mensal, por unidade** ou **anual, por mês** (com filtro de setor ou unidade).
- **Profissionais:** todos, só da empresa, só residentes ou só estagiários. Atendimentos, retornos,
  atividades, reuniões e atividades gerenciais seguem esse filtro. Admissões, 1º atendimento e
  desfechos são do serviço todo (a admissão não pertence a uma categoria).
- **Seções:** atendimentos (pacientes, familiares atendidos, total de pessoas); admissões e suas
  distribuições (tipo, motivo e prioridade da solicitação, para quem, descrição da demanda, prioridade
  do seguimento, necessidade de acompanhamento); 1º atendimento no prazo (com % e média de dias);
  resposta à solicitação no prazo (com % geral e por prioridade e média de horas); retornos no prazo
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
  PainelIndicadores.js indicadores assistenciais: primeiro atendimento, interconsultas e retornos
  Transferencias.js localização atual e histórico de transferências internas
  Db.js             leitura e gravação das abas como tabelas
  Setup.js          função "configurar": cria e semeia o banco
  Main.js           doGet, controle de acesso, tratamento de erros
  Api.js            funções da tela: início, pacientes e cadastros
  Admissoes.js      admissões, atendimentos, atividades, retomada e recálculo dos prazos
  Compilado.js      compilado, exportação, reuniões e atividades gerenciais
  Interconsultas.js solicitações independentes, migração do legado e vínculo com respostas
  Gestao.js         telas de gestão: pacientes por unidade, interconsultas e prazos
  Autoteste.js      testarSistema: teste do fluxo inteiro no Google de verdade
  Desempenho.js     medirDesempenho: tempo de cada ação, antes e depois da leitura pela API
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

### Publicação automática pelo GitHub (já configurada)

O arquivo `.clasp.json` liga este repositório ao projeto do Apps Script (ID do script). A automação
`.github/workflows/publicar-apps-script.yml` roda os testes a cada atualização em `src/` e, se
passarem, envia o código ao Apps Script (`clasp push`). Para funcionar:

1. Ativar a API do Apps Script em script.google.com/home/usersettings, na conta que vai publicar.
2. Essa conta precisa ser dona ou editora do projeto do Apps Script.
3. Rodar `clasp login` no computador e guardar o conteúdo de `~/.clasprc.json` no GitHub em
   **Settings > Secrets and variables > Actions** com o nome `CLASPRC_JSON`.
4. Depois da primeira implantação do app da Web, colocar o ID da implantação em `DEPLOYMENT_ID`
   no arquivo da automação: a cada atualização, a mesma implantação (mesmo link) recebe a versão nova.

Também dá para rodar manualmente em **Actions > Publicar no Apps Script > Run workflow**.

### Pelo clasp (linha de comando)

1. `npm install -g @google/clasp` e `clasp login`.
2. O `.clasp.json` já aponta para o projeto. Para outro projeto, troque o `scriptId`.
3. `clasp push --force` e, no editor, rode a função `configurar`.

### Depois de instalar

1. **Implantar > Nova implantação > App da Web**: executar como **usuário que acessa o app**, acesso
   para **qualquer pessoa com conta Google**. O link gerado é o endereço do sistema.
2. Compartilhe a planilha do banco como **editor** com a equipe (o app grava com a conta de quem usa).
3. No sistema, em **Cadastros**: inclua cada profissional com o e-mail Google dela; confira as
   prioridades e prazos, os motivos da solicitação e as justificativas (já vêm com as matrizes do HGWA),
   os desfechos, os parâmetros e os feriados (vêm só os nacionais de 2026 e 2027).

### Atualizar para uma versão nova

Cole de novo os arquivos de `dist/` (ou `clasp push`) e, em **Implantar > Gerenciar implantações**,
edite a implantação e escolha **Nova versão**. Rode `configurar` de novo: ela só acrescenta o que
falta e não apaga dados.

## Autoteste no Google

No editor do Apps Script, escolha a função `testarSistema` e clique em **Executar**. Ela cria uma
planilha de teste (não mexe no banco real), passa pelo fluxo inteiro (configuração, paciente, admissão
com solicitação, telas de gestão, atendimentos, desfechos, retomada, registro do dia, compilado,
exportação e tela) e
mostra no **registro de execução** o que passou e o que falhou. No fim, apague do Drive as duas
planilhas de teste listadas no registro.

## Desempenho

Cada consulta ao Google tem um custo fixo de tempo, então o sistema conversa com o banco pela API do
Google Planilhas (serviço avançado "Sheets", ligado no `appsscript.json`):

- **Leitura:** todas as abas numa consulta só, uma vez por execução.
- **Gravação:** cada operação (registrar atendimento, salvar admissão...) roda inteira com uma trava
  só. A linha nova vai numa chamada, e as linhas alteradas (inclusive os prazos recalculados) vão
  juntas numa chamada no fim. O que foi gravado já fica na memória, sem ler a planilha de novo.
- **Abertura:** os dados da primeira tela (usuário, cadastros e o painel do Início) já vão dentro da
  página gerada pelo `doGet`, e o navegador não precisa pedir nada ao abrir.
- Se a operação falhar no meio, as linhas alteradas nela não são gravadas.
- Se a API não responder, o sistema volta a ler e gravar aba por aba, mais devagar.

Para medir na conta do Google, rode `medirDesempenho` no editor do Apps Script. Ela mostra no registro
de execução o tempo de cada ação lendo e gravando aba por aba (como era antes) e pela API (como é agora). As
leituras usam o banco real sem alterar nada; as gravações usam uma planilha de teste, que pode ser
apagada do Drive depois.

## Testes

```
npm test
```

Roda as regras, o compilado e o servidor (configuração, banco, admissões, atendimentos, prazos,
gestão, exportação e registro do dia) com os serviços do Google simulados em memória.

### Solicitações independentes por internação

- A admissão guarda os dados da entrada. Interconsultas são registros separados vinculados ao ID da internação; uma nova solicitação não sobrescreve a anterior.
- Em Atendimentos, abra **Nova interconsulta**, informe data/hora, motivo e destinatário; a solicitação é sempre da equipe. A prioridade e o prazo vigentes ficam registrados nessa solicitação; mudanças posteriores na matriz valem para as próximas solicitações.
- Ao registrar um atendimento, selecione **Tipo da solicitação** (interconsulta, busca ativa, espontânea ou seguimento psicológico); para interconsulta, informe a solicitação respondida. Atendimentos de rotina não encerram solicitações automaticamente. Também é possível vincular um atendimento já registrado; o servidor valida a internação, o horário e o público atendido. Um atendimento pode ser vinculado explicitamente a mais de uma solicitação, se respondeu a ambas.
- Alta psicológica não impede novas solicitações enquanto o paciente segue internado. Use **Retomar acompanhamento** para voltar a registrar atendimentos. A saída hospitalar impede novas solicitações nessa internação.
- Gestão conta solicitações pendentes, inclusive várias do mesmo paciente; o resumo de prazos mostra a mais urgente. O compilado conta cada solicitação no mês em que foi feita, independentemente do mês de admissão.
- A migração preserva a associação automática das solicitações antigas ao primeiro atendimento elegível. Nas novas, o vínculo é explícito. Excluir um atendimento vinculado deixa a solicitação novamente sem resposta.

O cadastro do paciente inclui **sexo** (feminino, masculino, intersexo ou não informado) e **data de nascimento**, tanto na tela Pacientes quanto no cadastro durante a admissão. São campos opcionais para permitir completar os cadastros existentes. O servidor rejeita datas inválidas ou futuras; a atualização acrescenta as colunas ao final da aba PACIENTES, preservando IDs e dados anteriores.

Na tela **Atendimentos**, o filtro **Situação do acompanhamento** oferece Ativos (sem desfecho vigente), Inativos (qualquer desfecho vigente, inclusive saída hospitalar) e Todos. Retomar o acompanhamento torna a admissão ativa novamente. Cada novo atendimento exige o tipo da solicitação e o mostra no histórico; registros antigos sem essa informação ficam como Não informado. Vincular um atendimento existente como resposta a uma interconsulta classifica esse atendimento como Interconsulta.

Cada interconsulta possui o botão **Excluir interconsulta**, disponível para quem a cadastrou e para a coordenação. Após confirmação, a solicitação deixa de aparecer na tela, nos prazos e nos indicadores. Atendimentos vinculados e dados da admissão são preservados. O banco mantém uma marca de exclusão com autor e data para evitar que a migração recrie solicitações antigas excluídas.

### Tela Indicadores

A seção **Indicadores** é independente do Compilado. Possui filtros de mês, setor, unidade e paciente, três cartões de percentual, barras de distribuição e consulta dos casos com acesso à internação.

- **Primeiro atendimento:** admissões do mês, considerando somente entradas a partir de **03/11/2026**, início oficial combinado para o indicador. O prazo usa o parâmetro de dias úteis e os feriados. Entradas anteriores aparecem separadas, fora do percentual.
- **Interconsultas:** cada solicitação feita no mês conta separadamente, com o próprio prazo em horas úteis e resposta vinculada; há detalhamento por prioridade. Solicitações excluídas não entram.
- **Acompanhamento:** cada intervalo de retorno cujo prazo vence no mês conta uma vez. A justificativa do contato anterior determina o prazo e o grupo histórico; a justificativa vigente define a próxima pendência aberta. Contatos no mesmo dia não multiplicam a obrigação. Atendimento à família só responde ao prazo do paciente quando ele estava impossibilitado. Desfechos interrompem as obrigações; retomadas iniciam um novo ciclo.

O percentual é **no prazo / (no prazo + fora do prazo)**. Prazos já vencidos sem atendimento entram como fora do prazo e são destacados separadamente. Casos ainda dentro do prazo, sem prazo definido, não aplicáveis, com dados pendentes ou anteriores ao início oficial ficam fora do denominador. Sem casos avaliáveis, a tela mostra **—**, em vez de 0%. O agrupamento usa todos os casos; a lista de pacientes mostra até 300 por indicador e orienta usar os filtros quando esse limite é alcançado.

### Localização atual e transferências internas

Na tela **Atendimentos**, abra o paciente e a seção **Localização atual e transferências internas**. Selecione setor e unidade de destino, informe data e hora e clique em **Alterar setor/unidade atual**. A movimentação permanece na mesma internação, preservando unidade/data da admissão, histórico clínico e prazos. Acompanhamentos encerrados por desfecho psicológico ainda podem ser movimentados enquanto o paciente segue internado; após a saída hospitalar, a localização fica disponível para consulta.

A lista de Atendimentos, Gestão e seus filtros usam a localização atual. O formulário de atendimento já sugere essa unidade; ao alterar a data/hora do contato, sugere a unidade conhecida naquele momento, permitindo selecionar onde o atendimento efetivamente ocorreu. Cada atendimento mantém sua própria unidade no histórico e no compilado. Atividades, solicitações e novos desfechos usam a localização correspondente à data do evento. As admissões continuam agrupadas pela unidade de entrada.

As transferências ficam na aba **TRANSFERENCIAS**, criada automaticamente no primeiro acesso. Cadastros existentes sem movimentações continuam com a unidade da admissão como localização atual. Transferências não alteram a unidade dos registros anteriores e não são herdadas por uma nova admissão do mesmo paciente.

### Horas úteis das interconsultas

Os prazos de 24, 48 e 72 horas das interconsultas contam somente minutos de dias úteis, excluindo sábados, domingos e feriados cadastrados. A contagem usa as 24 horas de cada dia útil; não presume expediente de 8 horas ou uma faixa diária. Exemplo: sexta-feira às 10h + 24h úteis vence na segunda-feira às 10h, ou na terça-feira se a segunda for feriado. Solicitações em dia não útil começam a contar à meia-noite do próximo dia útil. Um vencimento à meia-noite de um dia não útil passa para a meia-noite do próximo dia útil.

As datas de vencimento são recalculadas ao consultar os registros. O tempo restante, o tempo até a resposta, o percentual de pontualidade e a média de resposta no compilado usam o mesmo calendário. Os valores numéricos das prioridades e os prazos de primeiro atendimento/retorno em dias úteis são preservados.

### Justificativa no registro do atendimento

A seção **Dados do acompanhamento** contém descrição da demanda e necessidade de acompanhamento. A **justificativa** é escolhida em **Registrar 1º atendimento (avaliação)** e nos atendimentos seguintes, sendo obrigatória quando há necessidade de acompanhamento. É possível salvar os dados clínicos antes dessa escolha; a justificativa é validada quando o atendimento é registrado.

Cada atendimento guarda a justificativa selecionada e a exibe no histórico. O contato válido mais recente atualiza a justificativa vigente e o prazo do próximo retorno. Um registro retroativo mantém sua própria justificativa sem substituir a vigente; atendimento à família sem paciente impossibilitado também não substitui a justificativa do último contato que conta para o prazo do paciente. Os registros anteriores mantêm suas justificativas para avaliar os intervalos de retorno e o indicador de acompanhamento.

### Prazos separados no histórico de atendimentos

O histórico apresenta duas avaliações independentes: **Interconsulta — prazo e resultado**, com o prazo em data/hora e resultado de cada solicitação efetivamente respondida pelo atendimento; e **Primeiro atendimento / retorno — prazo e resultado**, identificando qual prazo clínico está sendo avaliado. Um mesmo atendimento pode responder à interconsulta no prazo e, simultaneamente, ultrapassar o prazo do retorno. Sem solicitação vinculada, a tela informa essa ausência e não atribui resultado de interconsulta.

Para primeiro atendimento de admissões anteriores a **03/11/2026**, a apresentação mostra **Fora do período de avaliação**, sem exibir um vencimento antigo como atraso desse indicador. Retornos anteriores à data de início continuam sendo avaliados pela justificativa do contato anterior. A data de início é compartilhada entre o painel e o histórico em `APP.inicioIndicadorPrimeiro`. Os campos históricos originais são preservados; a apresentação consulta separadamente o vínculo da interconsulta e o prazo clínico.

### Carregamento

A página já abre com o resultado de `apiInicio(true)` (usuário, opções e painel), embutido pelo `doGet`. Ao voltar ao início, o painel é consultado novamente. A leitura do banco é feita numa consulta só para todas as abas (ver "Desempenho"), com índices em memória para IDs e agrupamentos por admissão. Permissões, cadastros, dados clínicos e regras de prazo são lidos do banco em cada execução; não há cache entre execuções.

A própria leitura cria abas novas e acrescenta colunas novas no cabeçalho quando faltam. A migração das solicitações antigas para INTERCONSULTAS é conferida em memória e só adquire a trava quando há registros a migrar. `tests/desempenho.test.js` verifica a abertura numa consulta só, o bloqueio de acesso na execução seguinte, as alterações de cadastro na abertura seguinte e o funcionamento sem a API.
