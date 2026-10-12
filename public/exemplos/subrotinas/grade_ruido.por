/* CLIQUE NO SINAL DE "+", À ESQUERDA, PARA EXIBIR A DESCRIÇÃO DO EXEMPLO
 *  
 * Copyright (C) 2026 - UNIVALI - Universidade do Vale do Itajaí
 * 
 * Este arquivo de código fonte é livre para utilização, cópia e/ou modificação
 * desde que este cabeçalho, contendo os direitos autorais e a descrição do programa, 
 * seja mantido.
 * 
 * Descrição:
 * 
 * 	Este exemplo ilustra a criação de uma animação suave no console através
 * 	do uso e composição de sub-rotinas (funções com retorno e procedimentos).
 * 	
 * 	O algoritmo simula um campo de ruído procedural contínuo (estilo Perlin Noise /
 * 	ondas de relevo) em uma grade bidimensional.
 * 	
 * 	Para garantir uma visualização agradável e sem cintilações (flickering), o programa
 * 	utiliza o conceito de "Buffer de Quadro": uma sub-rotina monta todo o texto do quadro
 * 	em memória em uma única cadeia antes de exibi-lo no console com um único comando 'escreva'.
 * 	
 * 	Conceitos de sub-rotinas ilustrados:
 * 	  - Procedimento de controle da animação;
 * 	  - Funções de composição de texto ('montar_quadro', 'construir_grade', 'construir_linha');
 * 	  - Função matemática pura com retorno 'real' ('calcular_ruido');
 * 	  - Função de mapeamento visual com retorno 'cadeia' ('obter_simbolo');
 * 	  - Procedimento/função utilitária ('gerar_separador').
 * 	
 * Autores:
 * 
 * 	Equipe Portugol Studio
 * 	
 * Data: 11/10/2026
 */

programa
{
	inclua biblioteca Util --> u
	inclua biblioteca Matematica --> m
	
	// Constantes de dimensão da grade e taxa de animação
	const inteiro LARGURA = 32
	const inteiro ALTURA = 14
	const inteiro TOTAL_QUADROS = 120
	const inteiro INTERVALO_MS = 50

	funcao inicio()
	{
		// Chama a sub-rotina de controle passando os parâmetros de configuração
		executar_animacao(LARGURA, ALTURA, TOTAL_QUADROS, INTERVALO_MS)
	}

	// Procedimento: Gerencia o ciclo principal da animação
	funcao executar_animacao(inteiro largura, inteiro altura, inteiro total_quadros, inteiro intervalo_ms)
	{
		real tempo = 0.0
		real passo_tempo = 0.10

		para (inteiro quadro = 1; quadro <= total_quadros; quadro++)
		{
			// Constrói a imagem completa do quadro na memória antes de imprimir.
			// Essa técnica de buffer único evita cintilações e torna a animação agradável.
			cadeia imagem_quadro = montar_quadro(largura, altura, tempo, quadro, total_quadros)

			// Limpa e atualiza o console instantaneamente em um único comando
			limpa()
			escreva(imagem_quadro)
			
			tempo = tempo + passo_tempo
			u.aguarde(intervalo_ms)
		}

		escreva("\n--- Animação finalizada com sucesso! ---\n")
	}

	// Função: Monta a string completa de um quadro (cabeçalho + grade)
	// Retorno: Uma única cadeia contendo todo o texto a ser desenhado na tela
	funcao cadeia montar_quadro(inteiro largura, inteiro altura, real tempo, inteiro quadro_atual, inteiro total_quadros)
	{
		cadeia quadro = ""
		
		// Concatena as linhas do cabeçalho informativo
		quadro = quadro + "=== ANIMAÇÃO: GRADE DE RUÍDO PROCEDURAL (PERLIN NOISE) ===\n"
		quadro = quadro + "Quadro: " + quadro_atual + " de " + total_quadros + " | Buffer de Quadro Único\n"
		quadro = quadro + "Densidade: [ ] Vale  [.]  [:]  [+]  [*]  [#]  [@] Crista\n"
		quadro = quadro + gerar_separador(largura * 2) + "\n"
		
		// Concatena a grade bidimensional de caracteres
		quadro = quadro + construir_grade(largura, altura, tempo)
		
		retorne quadro
	}

	// Função: Constrói a grade completa concatenando as linhas calculadas
	funcao cadeia construir_grade(inteiro largura, inteiro altura, real tempo)
	{
		cadeia grade = ""
		
		para (inteiro y = 0; y < altura; y++)
		{
			// Constrói cada linha individual chamando uma sub-rotina especializada
			grade = grade + construir_linha(largura, y, tempo) + "\n"
		}
		
		retorne grade
	}

	// Função: Constrói uma linha horizontal da grade
	funcao cadeia construir_linha(inteiro largura, inteiro y, real tempo)
	{
		cadeia linha = ""
		
		para (inteiro x = 0; x < largura; x++)
		{
			// Sub-rotina calcula o valor contínuo do ruído nesta célula
			real densidade = calcular_ruido(x, y, tempo)
			
			// Sub-rotina converte a densidade no símbolo correspondente
			linha = linha + obter_simbolo(densidade)
		}
		
		retorne linha
	}

	// Função matemática: Simula ruído suave combinando múltiplos harmônicos de onda
	// Retorno: Valor real normalizado entre 0.0 (mínimo) e 1.0 (máximo)
	funcao real calcular_ruido(real x, real y, real tempo)
	{
		// Oitava 1: Ondulação de baixa frequência
		real onda1 = m.seno(x * 0.22 + tempo) + m.cosseno(y * 0.28 + tempo * 0.7)
		
		// Oitava 2: Ondulação diagonal média
		real onda2 = m.seno((x + y) * 0.35 - tempo * 1.1) * 0.6
		
		// Oitava 3: Detalhes finos de alta frequência
		real onda3 = m.cosseno((x - y) * 0.45 + tempo * 1.4) * 0.3
		
		// Soma das componentes
		real soma = onda1 + onda2 + onda3
		
		// Normalização para a escala [0.0, 1.0]
		real normalizado = (soma + 2.9) / 5.8
		
		// Limites de segurança
		se (normalizado < 0.0)
		{
			retorne 0.0
		}
		se (normalizado > 1.0)
		{
			retorne 1.0
		}
		
		retorne normalizado
	}

	// Função: Mapeia o valor de densidade para símbolos com gradação visual
	// Retorna uma cadeia com o símbolo e o espaçamento adequado para manter proporção quadrada
	funcao cadeia obter_simbolo(real densidade)
	{
		se (densidade < 0.18)
		{
			retorne "  "
		}
		se (densidade < 0.32)
		{
			retorne ". "
		}
		se (densidade < 0.46)
		{
			retorne ": "
		}
		se (densidade < 0.60)
		{
			retorne "+ "
		}
		se (densidade < 0.74)
		{
			retorne "* "
		}
		se (densidade < 0.88)
		{
			retorne "# "
		}
		
		retorne "@ "
	}

	// Função utilitária: Gera uma linha horizontal divisória de tamanho fixo
	funcao cadeia gerar_separador(inteiro tamanho)
	{
		cadeia linha = ""
		
		para (inteiro i = 0; i < tamanho; i++)
		{
			linha = linha + "-"
		}
		
		retorne linha
	}
}

/* $$$ Portugol Studio $$$ 
 * 
 * Esta seção do arquivo guarda informações do Portugol Studio.
 * Você pode apagá-la se estiver utilizando outro editor.
 * 
 * @POSICAO-CURSOR = 1200; 
 * @DOBRAMENTO-CODIGO = [1];
 * @PONTOS-DE-PARADA = ;
 * @SIMBOLOS-INSPECIONADOS = ;
 * @FILTRO-ARVORE-TIPOS-DE-DADO = inteiro, real, logico, cadeia, caracter, vazio;
 * @FILTRO-ARVORE-TIPOS-DE-SIMBOLO = variavel, vetor, matriz, funcao;
 */
