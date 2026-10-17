programa
{
    inclua biblioteca Graficos --> g
    inclua biblioteca Teclado --> t
    inclua biblioteca Mouse --> mouse
    inclua biblioteca Matematica --> m
    inclua biblioteca Tipos --> tipos
    inclua biblioteca Util --> u

    /* ARENA PULSAR — sobrevivência com dois joysticks, estilo arcade de 2010.
     * Esquerdo/WASD: mover. Direito/movimento XY do mouse: apontar a mira.
     * Clique: disparar (segure). Enter: recomeçar.
     * No computador, clique no campo para capturar o cursor; Esc o libera.
     * A mira usa movimento_x/y: demonstra o joystick de mouse relativo.
     */
    inteiro largura = 0, altura = 0, anterior = 0, pontos = 0, vidas = 3
    real jogador_x = 0.5, jogador_y = 0.6, mira_x = 0.5, mira_y = 0.3
    real inimigo_x[8], inimigo_y[8], tiro_x[16], tiro_y[16], tiro_dx[16], tiro_dy[16]
    logico tiro_ativo[16], enter_antes = falso
    inteiro proximo = 0
    real recarga = 0.0, invencivel = 0.0, tempo = 0.0

    funcao inteiro px(real v) { retorne tipos.real_para_inteiro(v) }
    funcao cor(inteiro r, inteiro v, inteiro a) { g.definir_cor(g.criar_cor(r, v, a)) }
    funcao texto(inteiro x, inteiro y, inteiro tamanho, cadeia s)
    {
        g.definir_tamanho_texto(tamanho * 1.0) g.desenhar_texto(x, y, s)
    }
    funcao inimigo(inteiro i)
    {
        inimigo_x[i] = u.sorteia(5, 95) / 100.0
        inimigo_y[i] = 0.0 - i * 0.15
    }
    funcao reiniciar()
    {
        pontos = 0 vidas = 3 jogador_x = 0.5 jogador_y = 0.6 mira_x = 0.5 mira_y = 0.3
        recarga = 0.0 invencivel = 0.0 tempo = 0.0
        para (inteiro i = 0; i < 8; i++) inimigo(i)
        para (inteiro i = 0; i < 16; i++) tiro_ativo[i] = falso
    }
    funcao inicio()
    {
        g.iniciar_modo_grafico(verdadeiro)
        g.definir_titulo_janela("Arena Pulsar — dois joysticks")
        g.entrar_modo_tela_cheia() mouse.capturar_cursor()
        reiniciar() anterior = u.tempo_decorrido()
        enquanto (verdadeiro)
        {
            inteiro agora = u.tempo_decorrido()
            real dt = (agora - anterior) / 1000.0
            se (dt > 0.05) dt = 0.05
            anterior = agora largura = g.largura_janela() altura = g.altura_janela()
            inteiro campo = altura - 240
            logico enter = t.tecla_pressionada(t.TECLA_ENTER)
            se (enter e nao enter_antes) reiniciar()
            enter_antes = enter
            // Coordenadas normalizadas preservam o estado ao girar a tela.
            mira_x += mouse.movimento_x() / (largura * 1.0)
            mira_y += mouse.movimento_y() / (campo * 1.0)
            se (mira_x < 0.03) mira_x = 0.03
            se (mira_x > 0.97) mira_x = 0.97
            se (mira_y < 0.0) mira_y = 0.0
            se (mira_y > 1.0) mira_y = 1.0
            se (vidas > 0)
            {
                tempo += dt recarga -= dt invencivel -= dt
                real dx = 0.0, dy = 0.0
                se (t.tecla_pressionada(t.TECLA_W)) dy -= 1.0
                se (t.tecla_pressionada(t.TECLA_S)) dy += 1.0
                se (t.tecla_pressionada(t.TECLA_A)) dx -= 1.0
                se (t.tecla_pressionada(t.TECLA_D)) dx += 1.0
                real tamanho = m.raiz(dx * dx + dy * dy, 2.0)
                se (tamanho > 0.0) { jogador_x += dx / tamanho * 160.0 * dt / largura jogador_y += dy / tamanho * 160.0 * dt / campo }
                se (jogador_x < 0.06) jogador_x = 0.06
                se (jogador_x > 0.94) jogador_x = 0.94
                se (jogador_y < 0.05) jogador_y = 0.05
                se (jogador_y > 0.95) jogador_y = 0.95
                se (mouse.botao_pressionado(mouse.BOTAO_ESQUERDO) e recarga <= 0.0)
                {
                    dx = (mira_x - jogador_x) * largura dy = (mira_y - jogador_y) * campo
                    tamanho = m.raiz(dx * dx + dy * dy, 2.0)
                    se (tamanho > 1.0)
                    {
                        tiro_x[proximo] = jogador_x tiro_y[proximo] = jogador_y
                        tiro_dx[proximo] = dx / tamanho * 440.0 / largura tiro_dy[proximo] = dy / tamanho * 440.0 / campo
                        tiro_ativo[proximo] = verdadeiro proximo = (proximo + 1) % 16 recarga = 0.16
                    }
                }
                para (inteiro i = 0; i < 8; i++)
                {
                    dx = (jogador_x - inimigo_x[i]) * largura dy = (jogador_y - inimigo_y[i]) * campo
                    tamanho = m.raiz(dx * dx + dy * dy, 2.0)
                    se (tamanho > 1.0) { inimigo_x[i] += dx / tamanho * (32.0 + tempo * 0.4) * dt / largura inimigo_y[i] += dy / tamanho * (32.0 + tempo * 0.4) * dt / campo }
                    se (tamanho < 25.0 e invencivel <= 0.0) { vidas-- invencivel = 1.5 inimigo(i) }
                }
                para (inteiro j = 0; j < 16; j++)
                {
                    se (tiro_ativo[j])
                    {
                        tiro_x[j] += tiro_dx[j] * dt tiro_y[j] += tiro_dy[j] * dt
                        se (tiro_x[j] < 0.0 ou tiro_x[j] > 1.0 ou tiro_y[j] < 0.0 ou tiro_y[j] > 1.0) tiro_ativo[j] = falso
                        para (inteiro i = 0; i < 8; i++)
                        {
                            dx = (tiro_x[j] - inimigo_x[i]) * largura dy = (tiro_y[j] - inimigo_y[i]) * campo
                            se (tiro_ativo[j] e dx * dx + dy * dy < 400.0) { pontos += 25 tiro_ativo[j] = falso inimigo(i) }
                        }
                    }
                }
            }
            cor(8, 23, 33) g.limpar()
            cor(90, 228, 219) texto(16, 14, 12, "ARCADE / DOIS JOYSTICKS")
            cor(236, 250, 255) texto(16, 34, 27, "ARENA PULSAR")
            texto(16, 72, 16, "Pontos " + pontos + "   ·   Vidas " + vidas)
            cor(18, 49, 62)
            para (inteiro x = 0; x < largura; x += 40) g.desenhar_linha(x, 110, x, altura - 140)
            para (inteiro y = 110; y < altura - 140; y += 40) g.desenhar_linha(0, y, largura, y)
            para (inteiro i = 0; i < 8; i++)
            {
                inteiro x = px(inimigo_x[i] * largura), y = 110 + px(inimigo_y[i] * campo)
                se (y >= 110)
                {
                    cor(255, 107, 122) g.desenhar_elipse(x - 13, y - 13, 26, 26, verdadeiro)
                    cor(84, 31, 56) g.desenhar_elipse(x - 5, y - 5, 10, 10, verdadeiro)
                }
            }
            cor(255, 225, 127)
            para (inteiro i = 0; i < 16; i++) se (tiro_ativo[i]) g.desenhar_elipse(px(tiro_x[i] * largura) - 4, 106 + px(tiro_y[i] * campo), 8, 8, verdadeiro)
            inteiro jx = px(jogador_x * largura), jy = 110 + px(jogador_y * campo)
            inteiro mx = px(mira_x * largura), my = 110 + px(mira_y * campo)
            cor(54, 105, 117) g.desenhar_linha(jx, jy, mx, my)
            cor(90, 228, 219)
            se (invencivel <= 0.0 ou px(tempo * 12.0) % 2 == 0) g.desenhar_elipse(jx - 16, jy - 16, 32, 32, verdadeiro)
            cor(236, 250, 255) g.desenhar_elipse(jx - 5, jy - 5, 10, 10, verdadeiro)
            g.desenhar_elipse(mx - 12, my - 12, 24, 24, falso)
            g.desenhar_linha(mx - 18, my, mx + 18, my) g.desenhar_linha(mx, my - 18, mx, my + 18)
            cor(150, 192, 207) texto(16, altura - 144, 12, "Esquerdo: mover · Direito: mirar · Clique: atirar")
            se (vidas <= 0)
            {
                cor(15, 36, 49) g.desenhar_retangulo(16, altura / 2 - 35, largura - 32, 92, verdadeiro, verdadeiro)
                cor(255, 225, 127) texto(30, altura / 2 - 20, 24, "FIM DA PARTIDA")
                cor(236, 250, 255) texto(30, altura / 2 + 15, 16, "Enter para tentar de novo")
            }
            g.renderizar()
        }
    }
}
