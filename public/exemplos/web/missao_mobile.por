programa
{
    inclua biblioteca Graficos --> g
    inclua biblioteca Teclado --> t
    inclua biblioteca Mouse --> mouse
    inclua biblioteca Util --> u
    inclua biblioteca Matematica --> m
    inclua biblioteca Tipos --> tipos

    /* MISSÃO ÓRBITA — laboratório de controles para celular.
     * Joystick de toque ou setas: pilotar. Espaço: turbo (junto com o joystick).
     * Toque/arraste no campo: a nave segue o sinalizador.
     * Colete 8 estrelas e desvie dos drones. Enter: nova missão.
     * No celular, os controles são criados a partir das bibliotecas usadas.
     * Tela cheia acompanha a orientação. Controles flutuam sobre o campo.
     * O joystick direito move o sinalizador; segure Clique para guiar.
     * Tudo é desenhado em Portugol, sem imagens ou outros arquivos.
     */
    inteiro largura = 480, altura = 600
    real frente_x = 0.0, frente_y = -1.0
    real nave_x = 240.0, nave_y = 460.0, energia = 100.0
    inteiro pontos = 0, escudos = 3, estrelas = 0, toques = 0
    inteiro alvo_x = 240, alvo_y = 460, ultimo_tempo = 0
    inteiro estrela_x[6], estrela_y[6]
    real invencivel = 0.0, pulso = 0.0
    logico usou_setas = falso, usou_turbo = falso, usou_toque = falso
    logico toque_anterior = falso, reinicio_anterior = falso

    funcao inteiro pixel(real valor) { retorne tipos.real_para_inteiro(valor) }

    funcao cor(inteiro r, inteiro v, inteiro a) { g.definir_cor(g.criar_cor(r, v, a)) }

    funcao texto(inteiro x, inteiro y, inteiro tamanho, cadeia mensagem)
    {
        g.definir_tamanho_texto(tamanho * 1.0)
        g.desenhar_texto(x, y, mensagem)
    }

    funcao reiniciar()
    {
        nave_x = largura / 2.0
        nave_y = altura - 180.0
        frente_x = 0.0
        frente_y = -1.0
        energia = 100.0
        pontos = 0
        estrelas = 0
        escudos = 3
        toques = 0
        invencivel = 0.0
        usou_setas = falso
        usou_turbo = falso
        usou_toque = falso
        para (inteiro i = 0; i < 6; i++)
        {
            estrela_x[i] = 40 + (i % 3) * (largura - 80) / 2
            estrela_y[i] = 160 + (i / 3) * (altura - 340) / 2
        }
    }

    funcao atualizar(real dt)
    {
        // O runtime redimensiona a janela quando o dispositivo gira.
        se (largura != g.largura_janela() ou altura != g.altura_janela())
        {
            real sx = g.largura_janela() / (largura * 1.0)
            real sy = (g.altura_janela() - 139.0) / (altura - 139.0)
            nave_x *= sx
            nave_y = 115.0 + (nave_y - 115.0) * sy
            para (inteiro i = 0; i < 6; i++)
            {
                estrela_x[i] = pixel(estrela_x[i] * sx)
                estrela_y[i] = 115 + pixel((estrela_y[i] - 115) * sy)
            }
            largura = g.largura_janela()
            altura = g.altura_janela()
        }
        logico reinicio = t.tecla_pressionada(t.TECLA_ENTER)
        se (reinicio e nao reinicio_anterior) reiniciar()
        reinicio_anterior = reinicio
        se (escudos > 0 e estrelas < 8)
        {
            real dx = 0.0, dy = 0.0
            se (t.tecla_pressionada(t.TECLA_SETA_ESQUERDA)) dx -= 1.0
            se (t.tecla_pressionada(t.TECLA_SETA_DIREITA)) dx += 1.0
            se (t.tecla_pressionada(t.TECLA_SETA_ACIMA)) dy -= 1.0
            se (t.tecla_pressionada(t.TECLA_SETA_ABAIXO)) dy += 1.0
            logico direcional = dx != 0.0 ou dy != 0.0
            se (direcional) usou_setas = verdadeiro

            logico toque = mouse.botao_pressionado(mouse.BOTAO_ESQUERDO)
            alvo_x = mouse.posicao_x()
            alvo_y = mouse.posicao_y()
            se (toque e alvo_y >= 115 e alvo_y <= altura - 24)
            {
                usou_toque = verdadeiro
                se (nao toque_anterior) toques++
                se (nao direcional)
                {
                    dx = alvo_x - nave_x
                    dy = alvo_y - nave_y
                    se (m.valor_absoluto(dx) < 5.0 e m.valor_absoluto(dy) < 5.0) { dx = 0.0 dy = 0.0 }
                }
            }
            toque_anterior = toque

            real comprimento = m.raiz(dx * dx + dy * dy, 2.0)
            se (comprimento > 0.0) { dx /= comprimento dy /= comprimento frente_x = dx frente_y = dy }
            real velocidade = 125.0
            se (t.tecla_pressionada(t.TECLA_ESPACO) e energia > 1.0)
            {
                velocidade = 255.0
                energia -= dt * 40.0
                usou_turbo = verdadeiro
            }
            senao energia += dt * 22.0
            se (energia > 100.0) energia = 100.0
            se (energia < 0.0) energia = 0.0
            nave_x += dx * velocidade * dt
            nave_y += dy * velocidade * dt
            se (nave_x < 24.0) nave_x = 24.0
            se (nave_x > largura - 24.0) nave_x = largura - 24.0
            se (nave_y < 140.0) nave_y = 140.0
            se (nave_y > altura - 24.0) nave_y = altura - 24.0

            para (inteiro i = 0; i < 6; i++)
            {
                real ex = estrela_x[i] - nave_x, ey = estrela_y[i] - nave_y
                se (ex * ex + ey * ey < 900.0)
                {
                    estrelas++
                    pontos += 100
                    estrela_x[i] = u.sorteia(40, largura - 40)
                    estrela_y[i] = u.sorteia(145, altura - 155)
                }
            }
            se (invencivel > 0.0) invencivel -= dt
            para (inteiro i = 0; i < 3; i++)
            {
                real drone_x = largura / 2.0 + m.seno(pulso * 0.7 + i * 2.0) * (largura / 2.0 - 45.0)
                real drone_y = 170.0 + i * (altura - 330.0) / 3.0
                real hx = drone_x - nave_x, hy = drone_y - nave_y
                se (hx * hx + hy * hy < 750.0 e invencivel <= 0.0)
                {
                    escudos--
                    invencivel = 1.6
                }
            }
        }
    }

    funcao desenhar()
    {
        cor(10, 17, 32)
        g.limpar()
        // Fundo estrelado e grade: o campo mantém a proporção em qualquer tela.
        para (inteiro i = 0; i < 36; i++)
        {
            cor(42, 58, 85)
            g.desenhar_elipse((i * 73 + 15) % largura, 115 + (i * 47) % (altura - 115), 2, 2, verdadeiro)
        }
        cor(20, 32, 50)
        para (inteiro x = 0; x <= largura; x += 40) g.desenhar_linha(x, 115, x, altura)
        para (inteiro y = 115; y <= altura; y += 40) g.desenhar_linha(0, y, largura, y)

        cor(111, 231, 227)
        texto(18, 14, 12, "ARCADE / CELULAR")
        cor(239, 246, 255)
        texto(18, 34, 26, "MISSÃO ÓRBITA")
        texto(18, 68, 14, "Estrelas " + estrelas + "/8   ·   " + pontos + " PTS")
        // Três cápsulas no HUD e três arcos ao redor da nave: um por escudo.
        para (inteiro i = 0; i < 3; i++)
        {
            se (i < escudos) cor(111, 231, 227) senao cor(38, 53, 72)
            g.desenhar_retangulo(largura - 84 + i * 22, 74, 16, 12, verdadeiro, verdadeiro)
        }
        cor(38, 53, 72)
        g.desenhar_retangulo(18, 96, largura - 36, 7, verdadeiro, verdadeiro)
        cor(111, 231, 227)
        g.desenhar_retangulo(18, 96, pixel(energia * (largura - 36) / 100.0), 7, verdadeiro, verdadeiro)
        para (inteiro i = 0; i < 6; i++)
        {
            inteiro x = estrela_x[i], y = estrela_y[i]
            cor(255, 203, 102)
            g.desenhar_elipse(x - 8, y - 8, 16, 16, verdadeiro)
            cor(255, 235, 184)
            g.desenhar_linha(x - 13, y, x + 13, y)
            g.desenhar_linha(x, y - 13, x, y + 13)
        }
        para (inteiro i = 0; i < 3; i++)
        {
            inteiro x = pixel(largura / 2.0 + m.seno(pulso * 0.7 + i * 2.0) * (largura / 2.0 - 45.0))
            inteiro y = 170 + i * (altura - 330) / 3
            cor(246, 113, 127)
            g.desenhar_retangulo(x - 15, y - 11, 30, 22, verdadeiro, verdadeiro)
            cor(70, 32, 50)
            g.desenhar_retangulo(x - 8, y - 3, 16, 6, falso, verdadeiro)
        }
        se (mouse.botao_pressionado(mouse.BOTAO_ESQUERDO) e alvo_y >= 115 e alvo_y <= altura - 24)
        {
            cor(111, 231, 227)
            g.desenhar_elipse(alvo_x - 18, alvo_y - 18, 36, 36, falso)
            g.desenhar_linha(alvo_x - 25, alvo_y, alvo_x + 25, alvo_y)
            g.desenhar_linha(alvo_x, alvo_y - 25, alvo_x, alvo_y + 25)
        }
        inteiro nx = pixel(nave_x), ny = pixel(nave_y)
        se (invencivel <= 0.0 ou pixel(pulso * 12.0) % 2 == 0)
        {
            para (inteiro escudo = 0; escudo < escudos; escudo++)
            {
                cor(111, 231, 227)
                para (inteiro passo = 0; passo < 14; passo++)
                {
                    real a = escudo * 2.0944 + passo * 0.12
                    g.desenhar_linha(nx + pixel(m.cosseno(a) * 26.0), ny + pixel(m.seno(a) * 26.0),
                        nx + pixel(m.cosseno(a + 0.12) * 26.0), ny + pixel(m.seno(a + 0.12) * 26.0))
                }
            }
            // Frente e perpendicular formam uma base: a nave aponta para o movimento.
            inteiro nave[4][2] = {
                {nx + pixel(frente_x * 18.0), ny + pixel(frente_y * 18.0)},
                {nx - pixel(frente_x * 13.0 + frente_y * 14.0), ny + pixel(frente_x * 14.0 - frente_y * 13.0)},
                {nx - pixel(frente_x * 7.0), ny - pixel(frente_y * 7.0)},
                {nx + pixel(frente_y * 14.0 - frente_x * 13.0), ny - pixel(frente_x * 14.0 + frente_y * 13.0)}
            }
            cor(111, 231, 227)
            g.desenhar_poligono(nave, verdadeiro)
            cor(239, 246, 255)
            g.desenhar_elipse(nx + pixel(frente_x * 3.0) - 4, ny + pixel(frente_y * 3.0) - 4, 8, 8, verdadeiro)
        }
        // Indicadores discretos de controles já experimentados, acima dos joysticks.
        cor(148, 169, 193)
        cadeia dica = "Mova · colete 8 estrelas · evite drones"
        se (usou_setas e usou_turbo e usou_toque) dica = "Multitoque dominado!"
        texto(18, altura - 155, 12, dica)

        se (escudos <= 0 ou estrelas >= 8)
        {
            cor(15, 26, 43)
            g.desenhar_retangulo(18, altura / 2 - 50, largura - 36, 120, verdadeiro, verdadeiro)
            cor(255, 203, 102)
            se (estrelas >= 8) texto(32, altura / 2 - 30, 24, "MISSÃO CUMPRIDA!")
            senao texto(32, altura / 2 - 30, 24, "VAMOS DE NOVO?")
            cor(239, 246, 255)
            texto(32, altura / 2 + 12, 16, "Enter para uma nova missão")
        }
        g.renderizar()
    }

    funcao inicio()
    {
        g.iniciar_modo_grafico(verdadeiro)
        g.definir_dimensoes_janela(480, 600)
        g.definir_titulo_janela("Missão Órbita — controles para celular")
        g.entrar_modo_tela_cheia()
        largura = g.largura_janela()
        altura = g.altura_janela()
        reiniciar()
        ultimo_tempo = u.tempo_decorrido()
        enquanto (verdadeiro)
        {
            inteiro agora = u.tempo_decorrido()
            real dt = (agora - ultimo_tempo) / 1000.0
            se (dt > 0.05) dt = 0.05
            ultimo_tempo = agora
            pulso += dt
            atualizar(dt)
            desenhar()
        }
    }
}
