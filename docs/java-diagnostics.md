# Diagnósticos do core Java e implementação web

Inventário gerado de \Portugol-Studio\core\src\main\java\br\univali\portugol\nucleo. Foram encontradas **112 classes concretas de erro/aviso** (5 aviso, 21 execucao, 5 infraestrutura, 53 semantica, 28 sintatica) e **102 lançamentos de mensagens das bibliotecas**. Tipos-base, tradutores e exceções internas de controle não são mensagens adicionais. As classes duplicadas do antigo interpretador e do executor compilado são listadas separadamente.

O JSON ao lado contém os fragmentos originais de cada mensagem e seu arquivo de origem. Os textos web preservam o significado, com instruções em português e sem HTML ou stack trace no editor.

## Regras incorporadas

- Sintaxe e léxico: nomes, palavras reservadas, comentários/literais, escapes, intervalo de inteiros, parênteses, blocos, comandos e expressões incompletas.
- Tipos: as dez tabelas de compatibilidade são extraídas literalmente do Java; operações, atribuições, argumentos e retornos as consultam.
- Símbolos: escopo, redeclaração, constantes, referências, inicialização e ocultação de globais.
- Funções: existência de inicio, assinatura inicial, quantidade/tipo/dimensão/modo dos argumentos, retorno em todos os caminhos e código inalcançável.
- Vetores/matrizes: tamanho constante positivo, limite de posições, tipos homogêneos, forma e quantidade de elementos, índices e atribuição por posição.
- Bibliotecas: inclusão, alias, funções e constantes existentes, parâmetros, falhas de execução com localização.
- Execução: divisão por zero, leitura de variável/elemento sem valor, índices fora dos limites, pilha, memória, conversão e entrada inválida.
- Os cinco avisos Java: conversão de valor, símbolo global ocultado, vetor que pode ser variável, matriz que pode ser variável, matriz que pode ser vetor. O aviso de símbolo sem uso é uma extensão web.

## Diferenças explícitas de plataforma

O executor Java aceita `inicio(cadeia argumentos[])`; no web os argumentos são um vetor vazio por padrão, configurável pelo runtime. A classe antiga que rejeitava qualquer parâmetro não determina a assinatura efetivamente aceita pelo executor. As extensões web de parâmetros opcionais existentes são preservadas em library-signatures.js.

O limite semântico Java de 16777216 posições é preservado; o runtime web tem também seu limite configurável de memória (padrão: 2000000 elementos). Erros de JARs, JVM, observador do depurador e API de refatoração não são simulados como erros artificiais no código do aluno. As classes correspondentes estão discriminadas na tabela. Globais e elementos de arrays recebem os padrões do executor compilado Java; variáveis locais sem valor não são silenciosamente inicializadas com zero.

A análise de inicialização é conservadora: não presume que condições separadas estejam correlacionadas. O exemplo varios.por foi ajustado para inicializar idade/altura antes das condições, sem modificar as saídas dos caminhos válidos.

## Mapeamento completo

| Classe Java / arquivo | Situação no web | Implementação / equivalência |
| --- | --- | --- |
| AvisoMatrizPodeSerVariavel — analise/semantica/avisos/AvisoMatrizPodeSerVariavel.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| AvisoMatrizPodeSerVetor — analise/semantica/avisos/AvisoMatrizPodeSerVetor.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| AvisoSimboloGlobalOcultado — analise/semantica/avisos/AvisoSimboloGlobalOcultado.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| AvisoValorExpressaoSeraConvertido — analise/semantica/avisos/AvisoValorExpressaoSeraConvertido.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| AvisoVetorPodeSerVariavel — analise/semantica/avisos/AvisoVetorPodeSerVariavel.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroExecucaoBiblioteca — bibliotecas/base/ErroExecucaoBiblioteca.java | implementado | runtime/core/runtime-values.js; A mensagem da biblioteca é preservada, com código estável e posição da chamada. |
| ErroCodigoNaoAlcancavel — execucao/erros/ErroCodigoNaoAlcancavel.java | antecipado | runtime/core/semantic-analysis.js; Código após retorne, pare ou laço infinito sem saída. |
| ErroDivisaoPorZero — execucao/erros/ErroDivisaoPorZero.java | implementado | runtime/core/runtime-values.js / runtime/core/runtime.js; Diagnóstico com mensagem em português e posição no código. |
| ErroEstouroPilha — execucao/erros/ErroEstouroPilha.java | implementado | runtime/core/runtime-values.js / runtime/core/runtime.js; Diagnóstico com mensagem em português e posição no código. |
| ErroExecucaoNaoTratado — execucao/erros/ErroExecucaoNaoTratado.java | implementado | runtime/core/runtime-values.js / runtime/core/runtime.js; Diagnóstico com mensagem em português e posição no código. |
| ErroFuncaoInicialInvalida — execucao/erros/ErroFuncaoInicialInvalida.java | antecipado | runtime/core/semantic-analysis.js; Validação da assinatura inicial, incluindo inicio(cadeia argumentos[]), aceita pelo executor Java. |
| ErroFuncaoInicialNaoDeclarada — execucao/erros/ErroFuncaoInicialNaoDeclarada.java | antecipado | runtime/core/semantic-analysis.js; ErroFuncaoInicioInexistente antes de executar. |
| ErroImpossivelConverterTipos — execucao/erros/ErroImpossivelConverterTipos.java | implementado | runtime/core/runtime-values.js / runtime/core/runtime.js; Diagnóstico com mensagem em português e posição no código. |
| ErroIndiceMatrizInvalido — execucao/erros/ErroIndiceMatrizInvalido.java | implementado | runtime/core/runtime-values.js / runtime/core/runtime.js; Diagnóstico com mensagem em português e posição no código. |
| ErroIndiceVetorInvalido — execucao/erros/ErroIndiceVetorInvalido.java | implementado | runtime/core/runtime-values.js / runtime/core/runtime.js; Diagnóstico com mensagem em português e posição no código. |
| ErroMemoriaInsuficiente — execucao/erros/ErroMemoriaInsuficiente.java | implementado | runtime/core/runtime-values.js / runtime/core/runtime.js; Diagnóstico com mensagem em português e posição no código. |
| ErroObservadorDepuracao — execucao/erros/ErroObservadorDepuracao.java | específico da JVM | src/App.jsx; O inspetor web usa eventos; não existe o protocolo ObservadorDepuracao do executor antigo. |
| ErroValorVetorMatrizNaoInicializado — execucao/erros/ErroValorVetorMatrizNaoInicializado.java | implementado | runtime/core/runtime-values.js / runtime/core/runtime.js; Diagnóstico com mensagem em português e posição no código. |
| ErroVariavelNaoInicializada — execucao/erros/ErroVariavelNaoInicializada.java | implementado | runtime/core/runtime-values.js / runtime/core/runtime.js; Diagnóstico com mensagem em português e posição no código. |
| ErroVariavelPodeNaoTerSidoInicializada — execucao/erros/ErroVariavelPodeNaoTerSidoInicializada.java | antecipado | runtime/core/semantic-analysis.js; Análise de caminhos de condições e laços; leitura também protegida em execução. |
| ErroDivisaoPorZero — execucao/erros/mensagens/ErroDivisaoPorZero.java | implementado | runtime/core/runtime-values.js / runtime/core/runtime.js; Diagnóstico com mensagem em português e posição no código. |
| ErroEstouroPilha — execucao/erros/mensagens/ErroEstouroPilha.java | implementado | runtime/core/runtime-values.js / runtime/core/runtime.js; Diagnóstico com mensagem em português e posição no código. |
| ErroExecucaoNaoTratado — execucao/erros/mensagens/ErroExecucaoNaoTratado.java | implementado | runtime/core/runtime-values.js / runtime/core/runtime.js; Diagnóstico com mensagem em português e posição no código. |
| ErroIndiceInvalido — execucao/erros/mensagens/ErroIndiceInvalido.java | implementado | runtime/core/runtime-values.js / runtime/core/runtime.js; Diagnóstico com mensagem em português e posição no código. |
| ErroMemoriaInsuficiente — execucao/erros/mensagens/ErroMemoriaInsuficiente.java | implementado | runtime/core/runtime-values.js / runtime/core/runtime.js; Diagnóstico com mensagem em português e posição no código. |
| ErroValorEntradaInvalido — execucao/erros/mensagens/ErroValorEntradaInvalido.java | implementado | runtime/core/runtime-values.js / runtime/core/runtime.js; Diagnóstico com mensagem em português e posição no código. |
| ErroCarregamentoBiblioteca — bibliotecas/base/ErroCarregamentoBiblioteca.java | antecipado | runtime/core/semantic-analysis.js; ErroInclusaoBiblioteca valida bibliotecas e aliases antes de executar. Não há carregamento de JARs. |
| ErroAnaliseNaCompilacao — compilador/ErroAnaliseNaCompilacao.java | substituído | runtime/core/compiler.js; A compilação é bloqueada com a lista de diagnósticos quando a análise encontra erros. |
| ErroAoRenomearSimbolo — ErroAoRenomearSimbolo.java | fora da análise de código | docs/java-diagnostics.md; Exceção da API Java de refatoração/renomeação, recurso inexistente no web; não é erro no programa do aluno. |
| ErroAoTentarObterDeclaracaoDoSimbolo — ErroAoTentarObterDeclaracaoDoSimbolo.java | fora da análise de código | docs/java-diagnostics.md; Exceção da API Java de navegação de declarações; a árvore web navega pelas posições do próprio parser. |
| ErroCompilacao — ErroCompilacao.java | substituído | runtime/core/compiler.js; Compilação Java/javac substituída pelo parser, análise semântica e geração JavaScript. |
| ErroAlgoritmoContemErros — analise/ErroAlgoritmoContemErros.java | implementado | src/App.jsx; Resumo de compilação com erros; detalhes individuais no painel. |
| ErroAliasInexistente — analise/semantica/erros/ErroAliasInexistente.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroAoAtribuirEmMatriz — analise/semantica/erros/ErroAoAtribuirEmMatriz.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroAoAtribuirEmVetor — analise/semantica/erros/ErroAoAtribuirEmVetor.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroAoInicializarMatriz — analise/semantica/erros/ErroAoInicializarMatriz.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroAoInicializarVetor — analise/semantica/erros/ErroAoInicializarVetor.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroAtribuirConstanteBiblioteca — analise/semantica/erros/ErroAtribuirConstanteBiblioteca.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroAtribuirEmChamadaFuncao — analise/semantica/erros/ErroAtribuirEmChamadaFuncao.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroAtribuirEmConstante — analise/semantica/erros/ErroAtribuirEmConstante.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroAtribuirEmExpressao — analise/semantica/erros/ErroAtribuirEmExpressao.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroAtribuirFuncaoBiblioteca — analise/semantica/erros/ErroAtribuirFuncaoBiblioteca.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroAtribuirMatrizVetorEmVariavel — analise/semantica/erros/ErroAtribuirMatrizVetorEmVariavel.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroBibliotecaNaoInserida — analise/semantica/erros/ErroBibliotecaNaoInserida.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroBlocoInvalido — analise/semantica/erros/ErroBlocoInvalido.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroCodigoNaoAlcancavel — analise/semantica/erros/ErroCodigoNaoAlcancavel.java | antecipado | runtime/core/semantic-analysis.js; Código após retorne, pare ou laço infinito sem saída. |
| ErroComandoNaoSuportado — analise/semantica/erros/ErroComandoNaoSuportado.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroConstanteNaoEncontradaNaBiblioteca — analise/semantica/erros/ErroConstanteNaoEncontradaNaBiblioteca.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroDefinirTipoDadoMatrizLiteral — analise/semantica/erros/ErroDefinirTipoDadoMatrizLiteral.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroDefinirTipoDadoVetorLiteral — analise/semantica/erros/ErroDefinirTipoDadoVetorLiteral.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroExpressaoTamanhoVetorMatriz — analise/semantica/erros/ErroExpressaoTamanhoVetorMatriz.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroFuncaoInicioInexistente — analise/semantica/erros/ErroFuncaoInicioInexistente.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroFuncaoInicioNaoAceitaParametros — analise/semantica/erros/ErroFuncaoInicioNaoAceitaParametros.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroFuncaoSemRetorne — analise/semantica/erros/ErroFuncaoSemRetorne.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroInclusaoBiblioteca — analise/semantica/erros/ErroInclusaoBiblioteca.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroInicializacaoConstante — analise/semantica/erros/ErroInicializacaoConstante.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroInicializacaoErrada — analise/semantica/erros/ErroInicializacaoErrada.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroInicializacaoInvalida — analise/semantica/erros/ErroInicializacaoInvalida.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroInicializacaoMatrizEmBranco — analise/semantica/erros/ErroInicializacaoMatrizEmBranco.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroLeiaNecessitaReferencia — analise/semantica/erros/ErroLeiaNecessitaReferencia.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroNumeroParametrosFuncao — analise/semantica/erros/ErroNumeroParametrosFuncao.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroOperandoEsquerdoAtribuicaoConstante — analise/semantica/erros/ErroOperandoEsquerdoAtribuicaoConstante.java | unificado | runtime/core/semantic-analysis.js; ErroAtribuirEmConstante / ErroAtribuirEmExpressao distinguem constantes e literais. |
| ErroParametroExcedente — analise/semantica/erros/ErroParametroExcedente.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroParametroRedeclarado — analise/semantica/erros/ErroParametroRedeclarado.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroParaSemExpressaoAtribuicao — analise/semantica/erros/ErroParaSemExpressaoAtribuicao.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroParaSemExpressaoComparacao — analise/semantica/erros/ErroParaSemExpressaoComparacao.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroPassagemParametroInvalida — analise/semantica/erros/ErroPassagemParametroInvalida.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroQuantidadeElementosColunaInicializacaoMatriz — analise/semantica/erros/ErroQuantidadeElementosColunaInicializacaoMatriz.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroQuantidadeElementosInicializacaoVetor — analise/semantica/erros/ErroQuantidadeElementosInicializacaoVetor.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroQuantidadeLinhasIncializacaoMatriz — analise/semantica/erros/ErroQuantidadeLinhasIncializacaoMatriz.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroQuantificadorParametroFuncao — analise/semantica/erros/ErroQuantificadorParametroFuncao.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroReferenciaInvalida — analise/semantica/erros/ErroReferenciaInvalida.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroSemanticoNaoTratado — analise/semantica/erros/ErroSemanticoNaoTratado.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroSimboloNaoDeclarado — analise/semantica/erros/ErroSimboloNaoDeclarado.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroSimboloNaoInicializado — analise/semantica/erros/ErroSimboloNaoInicializado.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroSimboloRedeclarado — analise/semantica/erros/ErroSimboloRedeclarado.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroTamanhoMaximoMatriz — analise/semantica/erros/ErroTamanhoMaximoMatriz.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroTamanhoMaximoVetor — analise/semantica/erros/ErroTamanhoMaximoVetor.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroTamanhoVetorMatriz — analise/semantica/erros/ErroTamanhoVetorMatriz.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroTipoParametroIncompativel — analise/semantica/erros/ErroTipoParametroIncompativel.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroTiposIncompativeis — analise/semantica/erros/ErroTiposIncompativeis.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroVaParaSemTitulo — analise/semantica/erros/ErroVaParaSemTitulo.java | inativo no Java | runtime/core/semantic-analysis.js; O visitante Java rejeita va_para e rótulos com ErroComandoNaoSuportado; o web mantém essa rejeição. |
| ErroVariavelPodeNaoTerSidoInicializada — analise/semantica/erros/ErroVariavelPodeNaoTerSidoInicializada.java | antecipado | runtime/core/semantic-analysis.js; Análise de caminhos de condições e laços; leitura também protegida em execução. |
| ErroVetorSemElementos — analise/semantica/erros/ErroVetorSemElementos.java | implementado | runtime/core/semantic-analysis.js; Diagnóstico com mensagem em português e posição no código. |
| ErroCadeiaIncompleta — analise/sintatica/erros/ErroCadeiaIncompleta.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroCaracterInvalidoReferencia — analise/sintatica/erros/ErroCaracterInvalidoReferencia.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroChaveDeVetorMatrizMalPosicionada — analise/sintatica/erros/ErroChaveDeVetorMatrizMalPosicionada.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroComandoEsperado — analise/sintatica/erros/ErroComandoEsperado.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroEscapeUnico — analise/sintatica/erros/ErroEscapeUnico.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroEscopo — analise/sintatica/erros/ErroEscopo.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroExpressaoEsperada — analise/sintatica/erros/ErroExpressaoEsperada.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroExpressaoForaEscopoFuncao — analise/sintatica/erros/ErroExpressaoForaEscopoFuncao.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroExpressaoIncompleta — analise/sintatica/erros/ErroExpressaoIncompleta.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroExpressaoInesperada — analise/sintatica/erros/ErroExpressaoInesperada.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroExpressoesForaEscopoPrograma — analise/sintatica/erros/ErroExpressoesForaEscopoPrograma.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroFaltaDoisPontos — analise/sintatica/erros/ErroFaltaDoisPontos.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroInteiroForaDoIntervalo — analise/sintatica/erros/ErroInteiroForaDoIntervalo.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroLinhaPuladaEmString — analise/sintatica/erros/ErroLinhaPuladaEmString.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroNomeIncompativel — analise/sintatica/erros/ErroNomeIncompativel.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroNomeSimboloEstaFaltando — analise/sintatica/erros/ErroNomeSimboloEstaFaltando.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroPalavraReservadaEstaFaltando — analise/sintatica/erros/ErroPalavraReservadaEstaFaltando.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroParaEsperaCondicao — analise/sintatica/erros/ErroParaEsperaCondicao.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroParametrosNaoTipados — analise/sintatica/erros/ErroParametrosNaoTipados.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroPareForaDeLoopOuSwitch — analise/sintatica/erros/ErroPareForaDeLoopOuSwitch.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroParentesis — analise/sintatica/erros/ErroParentesis.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroParsingNaoTratado — analise/sintatica/erros/ErroParsingNaoTratado.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroRealComVirgula — analise/sintatica/erros/ErroRealComVirgula.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroRetornoVetorMatriz — analise/sintatica/erros/ErroRetornoVetorMatriz.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroSenaoInesperado — analise/sintatica/erros/ErroSenaoInesperado.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroSimboloFaltandoOuRealComVirgula — analise/sintatica/erros/ErroSimboloFaltandoOuRealComVirgula.java | unificado | runtime/core/compiler.js; ErroNomeSimboloEstaFaltando / ErroRealComVirgula distinguem as duas causas. |
| ErroTipoDeDadoEstaFaltando — analise/sintatica/erros/ErroTipoDeDadoEstaFaltando.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |
| ErroTokenFaltando — analise/sintatica/erros/ErroTokenFaltando.java | implementado | runtime/core/diagnostics.js / runtime/core/compiler.js; Diagnóstico com mensagem em português e posição no código. |

## Reprodução

Execute `npm run sync:diagnostics -- <diretório nucleo do core Java>` para regenerar o inventário e as tabelas. `npm test` inclui casos válidos e inválidos de todas as famílias, os cinco avisos, erros de execução e análise dos 120 exemplos.
