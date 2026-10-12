programa
{
    inclua biblioteca Graficos --> g
    inclua biblioteca Mouse --> mouse
    inclua biblioteca Teclado --> t
    inclua biblioteca Tipos --> tipos
    inclua biblioteca Util --> u
    inclua biblioteca Matematica --> m

    /* Um pequeno mundo inspirado em Terraria, feito apenas com retângulos.
     * A/D ou setas: andar. Espaço: pular.
     * Esquerdo: minerar perto do personagem. Direito: construir.
     * 1 a 4: escolher material. R: reconstruir. Esc: terminar.
     * A matriz mundo guarda os blocos: 0 significa ar vazio.
     */
    const inteiro COLUNAS = 30, LINHAS = 16, BLOCO = 28
    const inteiro ORIGEM_X = 30, ORIGEM_Y = 114
    inteiro mundo[COLUNAS][LINHAS]
    inteiro buffer_cenario = 0, buffer_interface = 0
    logico cenario_sujo = verdadeiro, interface_suja = verdadeiro
    inteiro escolhido = 1, retirados = 0, colocados = 0
    logico reinicio_anterior = falso
    const inteiro JOGADOR_LARGURA = 16, JOGADOR_ALTURA = 38
    real jogador_x = 286.0, jogador_y = 214.0, velocidade_y = 0.0
    real passo_animacao = 0.0, golpe = 0.0
    inteiro olhando = 1
    logico no_chao = falso, pulo_anterior = falso
    inteiro estoque[5] = {0, 30, 30, 20, 20}

    funcao gerar_mundo()
    {
        para (inteiro x = 0; x < COLUNAS; x++)
        {
            inteiro superficie = 7 + (x / 5) % 3
            para (inteiro y = 0; y < LINHAS; y++)
            {
                mundo[x][y] = 0
                se (y >= superficie) mundo[x][y] = 1
                se (y >= superficie + 3) mundo[x][y] = 2
                // Uma pequena caverna para experimentar a construção.
                se (x >= 13 e x <= 18 e y >= 11 e y <= 13) mundo[x][y] = 0
            }
        }
        para (inteiro arvore = 0; arvore < 3; arvore++)
        {
            inteiro x = 4 + arvore * 9
            inteiro chao = 7 + (x / 5) % 3
            para (inteiro y = chao - 4; y < chao; y++) mundo[x][y] = 3
            para (inteiro dx = -2; dx <= 2; dx++)
                para (inteiro dy = -1; dy <= 1; dy++)
                    se (dx != 0 ou dy != 1) mundo[x + dx][chao - 4 + dy] = 4
        }
        jogador_x = 286.0
        jogador_y = 214.0
        velocidade_y = 0.0
        no_chao = falso
        golpe = 0.0
        para (inteiro tipo = 1; tipo <= 4; tipo++) estoque[tipo] = 30
        cenario_sujo = verdadeiro
        interface_suja = verdadeiro
        retirados = 0
        colocados = 0
    }

    // A caixa do personagem colide com as células sólidas do mundo.
    funcao logico colide(real px, real py)
    {
        se (px < 0.0 ou py < 0.0 ou px + JOGADOR_LARGURA > COLUNAS * BLOCO ou py + JOGADOR_ALTURA > LINHAS * BLOCO) retorne verdadeiro
        inteiro esquerda = tipos.real_para_inteiro(px / BLOCO)
        inteiro direita = tipos.real_para_inteiro((px + JOGADOR_LARGURA - 0.01) / BLOCO)
        inteiro topo = tipos.real_para_inteiro(py / BLOCO)
        inteiro base = tipos.real_para_inteiro((py + JOGADOR_ALTURA - 0.01) / BLOCO)
        para (inteiro x = esquerda; x <= direita; x++)
            para (inteiro y = topo; y <= base; y++)
                se (mundo[x][y] != 0) retorne verdadeiro
        retorne falso
    }

    funcao logico ocupa_jogador(inteiro x, inteiro y)
    {
        retorne x * BLOCO < jogador_x + JOGADOR_LARGURA e (x + 1) * BLOCO > jogador_x e y * BLOCO < jogador_y + JOGADOR_ALTURA e (y + 1) * BLOCO > jogador_y
    }

    funcao mover_jogador(real intervalo)
    {
        real movimento = 0.0
        se (t.tecla_pressionada(t.TECLA_A) ou t.tecla_pressionada(t.TECLA_SETA_ESQUERDA)) movimento -= 160.0
        se (t.tecla_pressionada(t.TECLA_D) ou t.tecla_pressionada(t.TECLA_SETA_DIREITA)) movimento += 160.0
        se (movimento > 0.0) olhando = 1
        se (movimento < 0.0) olhando = -1
        logico pulo = t.tecla_pressionada(t.TECLA_ESPACO)
        se (pulo e nao pulo_anterior e no_chao) { velocidade_y = -500.0 no_chao = falso }
        pulo_anterior = pulo
        // Passos pequenos evitam atravessar blocos quando um quadro demora.
        inteiro passos = tipos.real_para_inteiro(intervalo / 0.008) + 1
        real dt = intervalo / passos
        para (inteiro i = 0; i < passos; i++)
        {
            real novo_x = jogador_x + movimento * dt
            se (nao colide(novo_x, jogador_y)) jogador_x = novo_x
            velocidade_y += 1800.0 * dt
            se (velocidade_y > 700.0) velocidade_y = 700.0
            real novo_y = jogador_y + velocidade_y * dt
            se (nao colide(jogador_x, novo_y)) { jogador_y = novo_y no_chao = falso }
            senao { se (velocidade_y > 0.0) no_chao = verdadeiro velocidade_y = 0.0 }
        }
        se (movimento != 0.0 e no_chao) passo_animacao += intervalo * 14.0
        senao passo_animacao = 0.0
        se (golpe > 0.0) golpe -= intervalo * 4.0
        se (golpe < 0.0) golpe = 0.0
    }

    funcao desenhar_jogador()
    {
        inteiro x = ORIGEM_X + tipos.real_para_inteiro(jogador_x)
        inteiro y = ORIGEM_Y + tipos.real_para_inteiro(jogador_y)
        inteiro passo = tipos.real_para_inteiro(m.seno(passo_animacao) * 3.0)
        // Sprite em pixels: cabelo, rosto, camisa, braços e botas.
        g.definir_cor(g.criar_cor(44, 47, 58))
        g.desenhar_retangulo(x - 1, y, 18, 10, falso, verdadeiro)
        g.definir_cor(g.criar_cor(231, 177, 127))
        g.desenhar_retangulo(x + 2, y + 5, 12, 10, falso, verdadeiro)
        g.definir_cor(g.criar_cor(32, 40, 49))
        se (olhando == 1) g.desenhar_retangulo(x + 11, y + 8, 2, 2, falso, verdadeiro)
        senao g.desenhar_retangulo(x + 3, y + 8, 2, 2, falso, verdadeiro)
        g.definir_cor(g.criar_cor(62, 125, 171))
        g.desenhar_retangulo(x, y + 15, 16, 14, falso, verdadeiro)
        g.definir_cor(g.criar_cor(231, 177, 127))
        g.desenhar_retangulo(x - 3, y + 17, 4, 11, falso, verdadeiro)
        g.desenhar_retangulo(x + 15, y + 17, 4, 11, falso, verdadeiro)
        g.definir_cor(g.criar_cor(43, 59, 86))
        g.desenhar_retangulo(x + 1, y + 29, 6, 8 + passo, falso, verdadeiro)
        g.desenhar_retangulo(x + 9, y + 29, 6, 8 - passo, falso, verdadeiro)
        g.definir_cor(g.criar_cor(54, 40, 35))
        g.desenhar_retangulo(x, y + 35 + passo, 8, 3, falso, verdadeiro)
        g.desenhar_retangulo(x + 8, y + 35 - passo, 8, 3, falso, verdadeiro)
        // A picareta acompanha a direção do personagem e o golpe de mineração.
        inteiro balanco = tipos.real_para_inteiro(m.seno(golpe * 3.14159) * 12.0)
        inteiro mao_x = x + 8 + olhando * 10
        g.definir_cor(g.criar_cor(169, 116, 64))
        para (inteiro i = 0; i < 3; i++) g.desenhar_linha(mao_x + i, y + 23, mao_x + olhando * 13 + i, y + 5 + balanco)
        g.definir_cor(g.criar_cor(182, 206, 208))
        g.desenhar_retangulo(mao_x + olhando * 13 - 9, y + 3 + balanco, 20, 4, falso, verdadeiro)
    }

    funcao inteiro cor_bloco(inteiro tipo)
    {
        se (tipo == 1) retorne g.criar_cor(137, 89, 57)
        se (tipo == 2) retorne g.criar_cor(107, 122, 143)
        se (tipo == 3) retorne g.criar_cor(164, 113, 62)
        retorne g.criar_cor(75, 153, 88)
    }

    funcao cadeia nome_bloco(inteiro tipo)
    {
        se (tipo == 1) retorne "Terra"
        se (tipo == 2) retorne "Pedra"
        se (tipo == 3) retorne "Madeira"
        retorne "Folhas"
    }

    funcao desenhar_bloco(inteiro px, inteiro py, inteiro tipo, logico grama)
    {
        g.definir_cor(cor_bloco(tipo))
        g.desenhar_retangulo(px, py, BLOCO - 1, BLOCO - 1, falso, verdadeiro)
        g.definir_cor(g.criar_cor(47, 53, 67))
        g.desenhar_linha(px, py + BLOCO - 1, px + BLOCO - 1, py + BLOCO - 1)
        se (tipo == 1 e grama)
        {
            g.definir_cor(g.criar_cor(104, 192, 102))
            g.desenhar_retangulo(px, py, BLOCO - 1, 5, falso, verdadeiro)
        }
        se (tipo == 3)
        {
            g.definir_cor(g.criar_cor(105, 70, 44))
            g.desenhar_linha(px + 8, py + 3, px + 8, py + BLOCO - 4)
            g.desenhar_linha(px + 19, py + 8, px + 19, py + BLOCO - 3)
        }
        se (tipo == 2)
        {
            g.definir_cor(g.criar_cor(148, 163, 180))
            g.desenhar_retangulo(px + 5, py + 6, 7, 3, falso, verdadeiro)
            g.desenhar_retangulo(px + 16, py + 17, 6, 3, falso, verdadeiro)
        }
    }

    // O cenário só é redesenhado quando um bloco muda; o buffer é reutilizado.
    funcao atualizar_cenario()
    {
        g.usar_buffer(buffer_cenario)
        g.definir_cor(g.criar_cor(129, 189, 213))
        g.limpar()
        // Sol e montanhas: tudo é desenhado pelo próprio programa.
        g.definir_cor(g.criar_cor(250, 220, 126))
        g.desenhar_elipse(750, 125, 62, 62, verdadeiro)
        g.definir_cor(g.criar_cor(105, 159, 171))
        g.desenhar_elipse(30, 210, 430, 330, verdadeiro)
        g.desenhar_elipse(360, 190, 510, 360, verdadeiro)
        para (inteiro bx = 0; bx < COLUNAS; bx++)
            para (inteiro by = 0; by < LINHAS; by++)
                se (mundo[bx][by] != 0)
                    desenhar_bloco(ORIGEM_X + bx * BLOCO, ORIGEM_Y + by * BLOCO, mundo[bx][by], by == 0 ou mundo[bx][by - 1] == 0)
        cenario_sujo = falso
        g.usar_buffer(0)
    }

    // A interface usa uma camada transparente independente do terreno.
    funcao atualizar_interface()
    {
        g.limpar_buffer(buffer_interface)
        g.usar_buffer(buffer_interface)
        g.definir_cor(g.criar_cor(29, 39, 48))
        g.desenhar_retangulo(0, 0, 900, 98, falso, verdadeiro)
        g.desenhar_retangulo(0, 574, 900, 46, falso, verdadeiro)
        g.definir_cor(g.criar_cor(227, 235, 220))
        g.definir_tamanho_texto(22.0)
        g.desenhar_texto(30, 16, "MUNDO DE BLOCOS / 2D")
        g.definir_tamanho_texto(13.0)
        g.desenhar_texto(30, 51, "A/D: andar   Espaço: pular   Esquerdo: minerar   Direito: construir   1-4: material   R: reiniciar")
        g.desenhar_texto(30, 75, "Alcance: 5 blocos   |   Retirados: " + retirados + "   Colocados: " + colocados + "   |   Esc: sair")
        para (inteiro material = 1; material <= 4; material++)
        {
            inteiro px = 230 + (material - 1) * 130
            g.definir_cor(cor_bloco(material))
            g.desenhar_retangulo(px, 586, 22, 22, falso, verdadeiro)
            g.definir_cor(g.criar_cor(227, 235, 220))
            g.desenhar_texto(px + 30, 590, material + " " + nome_bloco(material) + " " + estoque[material])
            se (material == escolhido)
            {
                g.definir_cor(g.criar_cor(250, 220, 126))
                g.desenhar_retangulo(px - 6, 582, 126, 32, falso, falso)
            }
        }
        interface_suja = falso
        g.usar_buffer(0)
    }

    funcao inicio()
    {
        g.iniciar_modo_grafico()
        g.definir_dimensoes_janela(900, 620)
        g.definir_titulo_janela("Mundo de blocos 2D")
        buffer_cenario = g.criar_buffer(900, 620)
        buffer_interface = g.criar_buffer(900, 620)
        gerar_mundo()
        inteiro ultimo_tempo = u.tempo_decorrido()
        enquanto (nao t.tecla_pressionada(t.TECLA_ESC))
        {
            inteiro agora = u.tempo_decorrido()
            real intervalo = (agora - ultimo_tempo) / 1000.0
            ultimo_tempo = agora
            se (intervalo > 0.05) intervalo = 0.05
            mover_jogador(intervalo)
            inteiro material_anterior = escolhido
            se (t.tecla_pressionada(t.TECLA_1)) escolhido = 1
            se (t.tecla_pressionada(t.TECLA_2)) escolhido = 2
            se (t.tecla_pressionada(t.TECLA_3)) escolhido = 3
            se (t.tecla_pressionada(t.TECLA_4)) escolhido = 4
            se (material_anterior != escolhido) interface_suja = verdadeiro
            logico reinicio = t.tecla_pressionada(t.TECLA_R)
            se (reinicio e nao reinicio_anterior) gerar_mundo()
            reinicio_anterior = reinicio
            inteiro mx = mouse.posicao_x(), my = mouse.posicao_y()
            inteiro x = (mx - ORIGEM_X) / BLOCO, y = (my - ORIGEM_Y) / BLOCO
            logico dentro = mx >= ORIGEM_X e my >= ORIGEM_Y e mx < ORIGEM_X + COLUNAS * BLOCO e my < ORIGEM_Y + LINHAS * BLOCO
            real distancia_x = x * BLOCO + BLOCO / 2.0 - jogador_x - JOGADOR_LARGURA / 2.0
            real distancia_y = y * BLOCO + BLOCO / 2.0 - jogador_y - JOGADOR_ALTURA / 2.0
            logico alcance = distancia_x * distancia_x + distancia_y * distancia_y <= 5.0 * BLOCO * 5.0 * BLOCO
            se (dentro e alcance)
            {
                se (mouse.botao_pressionado(mouse.BOTAO_ESQUERDO) e mundo[x][y] != 0)
                {
                    estoque[mundo[x][y]]++
                    golpe = 1.0
                    se (distancia_x < 0.0) olhando = -1
                    senao olhando = 1
                    mundo[x][y] = 0
                    retirados++
                    cenario_sujo = verdadeiro
                    interface_suja = verdadeiro
                }
                senao se (mouse.botao_pressionado(mouse.BOTAO_DIREITO) e mundo[x][y] == 0 e estoque[escolhido] > 0 e nao ocupa_jogador(x, y))
                {
                    estoque[escolhido]--
                    golpe = 1.0
                    se (distancia_x < 0.0) olhando = -1
                    senao olhando = 1
                    mundo[x][y] = escolhido
                    colocados++
                    cenario_sujo = verdadeiro
                    interface_suja = verdadeiro
                }
            }
            se (cenario_sujo) atualizar_cenario()
            se (interface_suja) atualizar_interface()
            g.usar_buffer(0)
            g.desenhar_buffer(0, 0, buffer_cenario)
            g.desenhar_buffer(0, 0, buffer_interface)
            se (dentro)
            {
                se (alcance) g.definir_cor(g.criar_cor(255, 246, 208))
                senao g.definir_cor(g.criar_cor(200, 90, 90))
                g.desenhar_retangulo(ORIGEM_X + x * BLOCO, ORIGEM_Y + y * BLOCO, BLOCO - 1, BLOCO - 1, falso, falso)
            }
            desenhar_jogador()
            g.renderizar()
        }
        g.liberar_buffer(buffer_cenario)
        g.liberar_buffer(buffer_interface)
        g.encerrar_modo_grafico()
    }
}
