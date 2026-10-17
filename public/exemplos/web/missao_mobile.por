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
     * As coordenadas do Mouse continuam em 480 x 600 ao redimensionar.
     * Tudo é desenhado em Portugol, sem imagens ou outros arquivos.
     */
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
        nave_x = 240.0
        nave_y = 460.0
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
            estrela_x[i] = 60 + (i % 3) * 170
            estrela_y[i] = 190 + (i / 3) * 150
        }
    }

    funcao atualizar(real dt)
    {
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
            se (toque e alvo_y >= 150 e alvo_y <= 524)
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
            se (comprimento > 0.0) { dx /= comprimento dy /= comprimento }
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
            se (nave_x > 456.0) nave_x = 456.0
            se (nave_y < 164.0) nave_y = 164.0
            se (nave_y > 510.0) nave_y = 510.0

            para (inteiro i = 0; i < 6; i++)
            {
                real ex = estrela_x[i] - nave_x, ey = estrela_y[i] - nave_y
                se (ex * ex + ey * ey < 900.0)
                {
                    estrelas++
                    pontos += 100
                    estrela_x[i] = u.sorteia(40, 440)
                    estrela_y[i] = u.sorteia(170, 490)
                }
            }
            se (invencivel > 0.0) invencivel -= dt
            para (inteiro i = 0; i < 3; i++)
            {
                real drone_x = 240.0 + m.seno(pulso * 0.7 + i * 2.0) * 180.0
                real drone_y = 245.0 + i * 90.0
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
            g.desenhar_elipse((i * 73 + 15) % 480, 150 + (i * 47) % 374, 2, 2, verdadeiro)
        }
        cor(20, 32, 50)
        para (inteiro x = 0; x <= 480; x += 40) g.desenhar_linha(x, 150, x, 524)
        para (inteiro y = 150; y <= 524; y += 40) g.desenhar_linha(0, y, 480, y)

        cor(111, 231, 227)
        texto(22, 14, 14, "LAB DE CONTROLES / CELULAR")
        cor(239, 246, 255)
        texto(20, 36, 32, "MISSÃO ÓRBITA")
        texto(22, 80, 19, "Estrelas: " + estrelas + "/8     Escudos: " + escudos)
        cor(38, 53, 72)
        g.desenhar_retangulo(22, 116, 436, 10, verdadeiro, verdadeiro)
        cor(111, 231, 227)
        g.desenhar_retangulo(22, 116, pixel(energia * 4.36), 10, verdadeiro, verdadeiro)
        cor(148, 169, 193)
        texto(22, 131, 12, "TURBO                                      " + pontos + " PTS")

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
            inteiro x = pixel(240.0 + m.seno(pulso * 0.7 + i * 2.0) * 180.0)
            inteiro y = 245 + i * 90
            cor(246, 113, 127)
            g.desenhar_retangulo(x - 15, y - 11, 30, 22, verdadeiro, verdadeiro)
            cor(70, 32, 50)
            g.desenhar_retangulo(x - 8, y - 3, 16, 6, falso, verdadeiro)
        }
        se (mouse.botao_pressionado(mouse.BOTAO_ESQUERDO) e alvo_y >= 150 e alvo_y <= 524)
        {
            cor(111, 231, 227)
            g.desenhar_elipse(alvo_x - 18, alvo_y - 18, 36, 36, falso)
            g.desenhar_linha(alvo_x - 25, alvo_y, alvo_x + 25, alvo_y)
            g.desenhar_linha(alvo_x, alvo_y - 25, alvo_x, alvo_y + 25)
        }
        inteiro nx = pixel(nave_x), ny = pixel(nave_y)
        se (invencivel <= 0.0 ou pixel(pulso * 12.0) % 2 == 0)
        {
            cor(54, 111, 139)
            g.desenhar_elipse(nx - 23, ny - 23, 46, 46, falso)
            cor(111, 231, 227)
            inteiro nave[4][2] = {{nx, ny - 18}, {nx + 14, ny + 13}, {nx, ny + 7}, {nx - 14, ny + 13}}
            g.desenhar_poligono(nave, verdadeiro)
            cor(239, 246, 255)
            g.desenhar_elipse(nx - 4, ny - 6, 8, 8, verdadeiro)
        }

        cor(15, 26, 43)
        g.desenhar_retangulo(0, 532, 480, 68, falso, verdadeiro)
        cor(148, 169, 193)
        texto(20, 540, 13, "JOYSTICK: MOVER / ESPAÇO: TURBO / TOQUE: GUIAR")
        se (usou_setas) cor(111, 231, 227) senao cor(148, 169, 193)
        texto(20, 564, 18, "1. Joystick")
        se (usou_turbo) cor(111, 231, 227) senao cor(148, 169, 193)
        texto(165, 564, 18, "2. Turbo")
        se (usou_toque) cor(111, 231, 227) senao cor(148, 169, 193)
        texto(315, 564, 18, "3. Toque")

        se (escudos <= 0 ou estrelas >= 8)
        {
            cor(15, 26, 43)
            g.desenhar_retangulo(36, 265, 408, 120, verdadeiro, verdadeiro)
            cor(255, 203, 102)
            se (estrelas >= 8) texto(70, 282, 28, "MISSÃO CUMPRIDA!")
            senao texto(72, 282, 28, "VAMOS DE NOVO?")
            cor(239, 246, 255)
            texto(72, 330, 18, "Enter para uma nova missão")
        }
        g.renderizar()
    }

    funcao inicio()
    {
        g.iniciar_modo_grafico(verdadeiro)
        g.definir_dimensoes_janela(480, 600)
        g.definir_titulo_janela("Missão Órbita — controles para celular")
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
