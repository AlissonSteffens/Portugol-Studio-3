programa
{
	inclua biblioteca Graficos --> g
	inclua biblioteca Util --> u
	inclua biblioteca Teclado --> t
	inclua biblioteca Tipos--> tp
	inclua biblioteca Matematica --> m

	/* Define quantos quadros serão desenhados por segundo (FPS) */
	const inteiro TAXA_ATUALIZACAO = 60

	const inteiro LARGURA_TELA = 800, ALTURA_TELA = 600, MARGEM_TELA = 15
	
	const inteiro SAIR = 0, TELA_MENU = 1, TELA_JOGO = 2


	const real VELOCIDADE_INICIAL_BASTAO = 5.0, VELOCIDADE_MINIMA_BASTAO = 5.0, VELOCIDADE_MAXIMA_BASTAO = 15.0

	const real VELOCIDADE_INICIAL_BOLINHA = 5.0, VELOCIDADE_MINIMA_BOLINHA = 5.0, VELOCIDADE_MAXIMA_BOLINHA = 15.0


	const inteiro ACIMA = 0, ABAIXO = 1, ESQUERDA = 2, DIREITA = 3
	
	
	inteiro tela_atual = TELA_JOGO
	
	real x_bastao = 0.0, y_bastao = 0.0, velocidade_bastao = 0.0
	
	inteiro largura_bastao = 100, altura_bastao = 12

	real x_bolinha = 0.0, y_bolinha = 0.0
	
	inteiro tamanho_bolinha = 16, raio_bolinha = (tamanho_bolinha / 2)

	inteiro direcao_bolinha_horizontal = 0, direcao_bolinha_vertical = 0
	
	real velocidade_bolinha_vertical = 0.0, velocidade_bolinha_horizontal = 0.0

	inteiro tempo_inicio = 0, tempo_decorrido = 0, tempo_restante = 0, tempo_quadro = 1000 / TAXA_ATUALIZACAO
	
	
	funcao inicio()
	{
		inicializar()	
		executar()
		finalizar()
	}

	funcao executar()
	{
		enquanto (tela_atual != SAIR)
		{
			escolha(tela_atual)
			{
				caso TELA_MENU: tela_menu() pare
				caso TELA_JOGO: tela_jogo() pare
			}
		}
	}

	funcao tela_menu()
	{
		enquanto (tela_atual == TELA_MENU)
		{
			desenhar_tela_menu()

			se (t.tecla_pressionada(t.TECLA_ENTER))
			{
				ir_para_tela(TELA_JOGO)
			}
			senao se (t.tecla_pressionada(t.TECLA_ESC))
			{
				ir_para_tela(SAIR)
			}
		}
	}

	funcao desenhar_tela_menu()
	{
		g.definir_cor(g.COR_PRETO)
		g.limpar()

		g.definir_cor(g.COR_BRANCO)
		g.definir_tamanho_texto(16.0)
		g.desenhar_texto(20, 20, "MENU")

		g.renderizar()
	}

	funcao tela_jogo()
	{
		reiniciar_jogo()
		
		enquanto (tela_atual == TELA_JOGO)
		{
			iniciar_controle_taxa_atualizacao()
			
			atualizar_logica_jogo()
			desenhar_tela_jogo()

			finalizar_controle_taxa_atualizacao()
		}
	}

	funcao iniciar_controle_taxa_atualizacao()
	{
		tempo_inicio = u.tempo_decorrido()
	}

	funcao finalizar_controle_taxa_atualizacao()
	{
		tempo_decorrido = u.tempo_decorrido() - tempo_inicio
		tempo_restante = tempo_quadro - tempo_decorrido 
			
		se (TAXA_ATUALIZACAO > 0  e tempo_restante > 0)
		{
			u.aguarde(tempo_restante)
		}
	}

	funcao atualizar_logica_jogo()
	{
		 verificar_interacao_usuario()
		 atualizar_posicao_bolinha()

		 //u.aguarde(100)
	}

	funcao atualizar_posicao_bolinha()
	{
		atualizar_posicao_vertical_bolinha()
		//atualizar_posicao_horizontal_bolinha()

		se (bolinha_bateu_bastao())
		{
			direcao_bolinha_vertical = ACIMA
		}
	}

	funcao atualizar_posicao_horizontal_bolinha()
	{
		se (direcao_bolinha_horizontal == DIREITA)
		{
			mover_bolinha_para_direita()
		}
		senao se (direcao_bolinha_horizontal == ESQUERDA)
		{
			mover_bolinha_para_esquerda()
		}
	}

	funcao mover_bolinha_para_direita()
	{
		x_bolinha = x_bolinha + velocidade_bolinha_horizontal
	}

	funcao mover_bolinha_para_esquerda()
	{
		x_bolinha = x_bolinha - velocidade_bolinha_horizontal
	}

	funcao atualizar_posicao_vertical_bolinha()
	{
		se (direcao_bolinha_vertical == ACIMA)
		{
			mover_bolinha_para_cima()
		}
		senao se (direcao_bolinha_vertical == ABAIXO)
		{
			mover_bolinha_para_baixo()
		}
	}

	funcao mover_bolinha_para_cima()
	{
		y_bolinha = y_bolinha - velocidade_bolinha_vertical

		se (bolinha_saiu_tela_por_cima())
		{
			y_bolinha = tp.inteiro_para_real(borda_superior_tela())

			direcao_bolinha_vertical = ABAIXO
		}
	}

	// Colisão círculo-retângulo: usa o ponto do bastão mais próximo do centro da bola.
    funcao logico bolinha_bateu_bastao()
    {
        real raio = tamanho_bolinha / 2.0
        real centro_x = x_bolinha + raio
        real centro_y = y_bolinha + raio
        real proximo_x = m.maior_numero(x_bastao, m.menor_numero(centro_x, x_bastao + largura_bastao))
        real proximo_y = m.maior_numero(y_bastao, m.menor_numero(centro_y, y_bastao + altura_bastao))
        real distancia_x = centro_x - proximo_x
        real distancia_y = centro_y - proximo_y
        retorne distancia_x * distancia_x + distancia_y * distancia_y <= raio * raio
    }

	funcao real valor_absoluto(real numero)
	{
		se (numero < 0)			// Se o número for negativo, torna-o positivo
		{
			numero = numero * -1
		}

		retorne numero
	}

	funcao real lateral_direita_bolinha()
	{
		retorne x_bolinha + tamanho_bolinha
	}

	funcao real lateral_esquerda_bolinha()
	{
		retorne x_bolinha
	}

	funcao logico bolinha_saiu_tela_por_cima()
	{
		retorne y_bolinha - tamanho_bolinha < borda_superior_tela()
	}

	funcao logico bolinha_saiu_tela_por_baixo()
	{
		retorne y_bolinha > borda_inferior_tela()
	}

	funcao mover_bolinha_para_baixo()
	{
		y_bolinha = y_bolinha + velocidade_bolinha_vertical

		se (bolinha_saiu_tela_por_baixo())
		{
			reiniciar_bolinha()
		}
	}

	funcao desenhar_tela_jogo()
	{
		g.definir_cor(g.COR_PRETO)
		g.limpar()

		desenhar_bastao()
		desenhar_bolinha()

		g.definir_cor(g.COR_VERMELHO)
		g.desenhar_linha(lateral_esquerda_bastao(), 0, lateral_esquerda_bastao(), ALTURA_TELA)
		g.desenhar_linha(lateral_direita_bastao(), 0, lateral_direita_bastao(), ALTURA_TELA)
//		g.desenhar_retangulo(x, y, largura, altura, arredondar_cantos, preencher)
//retorne y_bolinha + tamanho_bolinha >= y_bastao e x_bolinha >= x_bastao e x_bolinha + tamanho_bolinha <=latera

		g.definir_cor(g.COR_BRANCO)
		g.definir_tamanho_texto(16.0)
		g.desenhar_texto(20, 20, "JOGO")

		g.renderizar()
	}

	funcao verificar_interacao_usuario()
	{
		se (t.tecla_pressionada(t.TECLA_ESC))
		{
			ir_para_tela(TELA_MENU)
		}
		senao se (t.tecla_pressionada(t.TECLA_SETA_DIREITA))
		{
			mover_bastao_para_direita()
		}
		senao se (t.tecla_pressionada(t.TECLA_SETA_ESQUERDA))
		{
			mover_bastao_para_esquerda()
		}
	}

	funcao mover_bastao_para_direita()
	{
		x_bastao = x_bastao + velocidade_bastao

		se (bastao_saiu_tela())
		{
			x_bastao = tp.inteiro_para_real(borda_direita_tela() - largura_bastao)
		}
	}

	funcao mover_bastao_para_esquerda()
	{
		x_bastao = x_bastao - velocidade_bastao

		se (bastao_saiu_tela())
		{
			x_bastao = tp.inteiro_para_real(borda_esquerda_tela())
		}
	}

	funcao logico bastao_saiu_tela()
	{
		retorne bastao_saiu_tela_pela_esquerda() ou bastao_saiu_tela_pela_direita()
	}

	funcao logico bastao_saiu_tela_pela_esquerda()
	{
		retorne lateral_esquerda_bastao() < borda_esquerda_tela()
	}
	
	funcao logico bastao_saiu_tela_pela_direita()
	{
		retorne lateral_direita_bastao() > borda_direita_tela()
	}

	funcao real lateral_esquerda_bastao()
	{
		retorne x_bastao
	}

	funcao real lateral_direita_bastao()
	{
		retorne x_bastao + largura_bastao
	}
	
	funcao desenhar_bastao()
	{
		inteiro largura_centro_bastao = largura_bastao - altura_bastao
		inteiro largura_lateral_bastao = altura_bastao / 2

		inteiro x_bastao_int =  tp.real_para_inteiro(x_bastao)
		inteiro y_bastao_int =  tp.real_para_inteiro(y_bastao)

		inteiro x_lateral_esquerda_bastao = x_bastao_int
		inteiro x_lateral_direita_bastao = x_lateral_esquerda_bastao + largura_centro_bastao
		inteiro x_centro_bastao = x_lateral_esquerda_bastao + largura_lateral_bastao

		g.definir_cor(g.COR_AZUL)

		g.desenhar_elipse(x_lateral_esquerda_bastao, y_bastao_int, altura_bastao, altura_bastao, verdadeiro)
		g.desenhar_elipse(x_lateral_direita_bastao, y_bastao_int, altura_bastao, altura_bastao, verdadeiro)
		g.desenhar_retangulo(x_centro_bastao, y_bastao_int, largura_centro_bastao, altura_bastao, falso, verdadeiro)
	}

	funcao desenhar_bolinha()
	{
		inteiro x_bolinha_int = tp.real_para_inteiro(x_bolinha)
		inteiro y_bolinha_int = tp.real_para_inteiro(y_bolinha)
		
		g.definir_cor(g.COR_VERMELHO)
		g.desenhar_elipse(x_bolinha_int, y_bolinha_int, tamanho_bolinha, tamanho_bolinha, verdadeiro)
	}

	funcao ir_para_tela(inteiro tela)
	{
		tela_atual = tela

		enquanto (t.alguma_tecla_pressionada())
		{

		}
	}

	funcao inicializar()
	{
		g.iniciar_modo_grafico(verdadeiro)
		g.definir_titulo_janela("Arkanoid")
		g.definir_dimensoes_janela(800, 600)
	}

	funcao reiniciar_jogo()
	{
		reiniciar_bastao()
		reiniciar_bolinha()
	}

	funcao reiniciar_bastao()
	{
		sortear_posicao_bastao()
		
		velocidade_bastao = VELOCIDADE_INICIAL_BASTAO		
	}

	funcao reiniciar_bolinha()
	{
		centralizar_bolinha_no_bastao()

		direcao_bolinha_vertical = ACIMA
		direcao_bolinha_horizontal = u.sorteia(ESQUERDA, DIREITA)

		velocidade_bolinha_vertical = VELOCIDADE_INICIAL_BOLINHA
		velocidade_bolinha_horizontal = VELOCIDADE_INICIAL_BOLINHA
	}

	funcao centralizar_bolinha_no_bastao()
	{
		real x_centro_bastao = x_bastao + largura_bastao / 2
		
		y_bolinha = y_bastao - tamanho_bolinha - 1
		x_bolinha = x_centro_bastao - (tamanho_bolinha / 2)
	}

	funcao inteiro borda_esquerda_tela()
	{
		retorne MARGEM_TELA
	}

	funcao inteiro borda_direita_tela()
	{
		retorne LARGURA_TELA - MARGEM_TELA
	}

	funcao inteiro borda_superior_tela()
	{
		retorne MARGEM_TELA
	}

	funcao inteiro borda_inferior_tela()
	{
		retorne ALTURA_TELA - MARGEM_TELA
	}

	funcao sortear_posicao_bastao()
	{
		y_bastao = tp.inteiro_para_real(ALTURA_TELA - MARGEM_TELA - altura_bastao)

		inteiro x_minimo = borda_esquerda_tela()
		inteiro x_maximo = borda_direita_tela() - largura_bastao
		
		x_bastao = tp.inteiro_para_real(u.sorteia(x_minimo, x_maximo))
	}

	funcao finalizar()
	{
		g.encerrar_modo_grafico()
	}
}
/* $$$ Portugol Studio $$$ 
 * 
 * Esta seção do arquivo guarda informações do Portugol Studio.
 * Você pode apagá-la se estiver utilizando outro editor.
 * 
 * @POSICAO-CURSOR = 3724; 
 * @DOBRAMENTO-CODIGO = [48, 60, 77, 104, 109, 161, 173, 227, 232, 242, 264, 269, 277, 287, 292, 297, 302, 307, 338, 354, 364, 374, 379, 384, 389, 394, 399, 418, 427, 437, 444, 450, 457, 468, 476, 481, 486, 491, 496, 506];
 * @PONTOS-DE-PARADA = ;
 * @SIMBOLOS-INSPECIONADOS = ;
 * @FILTRO-ARVORE-TIPOS-DE-DADO = inteiro, real, logico, cadeia, caracter, vazio;
 * @FILTRO-ARVORE-TIPOS-DE-SIMBOLO = variavel, vetor, matriz, funcao;
 */