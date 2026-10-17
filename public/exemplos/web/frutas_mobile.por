programa
{
    inclua biblioteca Graficos --> g
    inclua biblioteca Mouse --> mouse
    inclua biblioteca Teclado --> t
    inclua biblioteca Tipos --> tipos
    inclua biblioteca Util --> u

    /* CORTE TROPICAL — arraste o dedo para cortar frutas, estilo celular de 2010.
     * Toque/arraste ou mouse esquerdo: lâmina. Evite as bombas escuras.
     * O joystick direito também move a lâmina; segure Clique para cortar.
     * Cada fruta perdida ou bomba custa uma vida. Enter reinicia.
     * Colisão por segmento detecta cortes rápidos entre dois frames.
     */
    real fruta_x[7], fruta_y[7], vx[7], vy[7], efeito_x[7], efeito_y[7], efeito[7]
    logico bomba[7], cortada[7], cortando_antes = falso, enter_antes = falso
    inteiro pontos = 0, vidas = 3, anterior = 0, ultimo_x = 0, ultimo_y = 0
    inteiro largura = 0, altura = 0
    real proxima = 0.0
    inteiro indice = 0

    funcao inteiro px(real v) { retorne tipos.real_para_inteiro(v) }
    funcao cor(inteiro r, inteiro v, inteiro a) { g.definir_cor(g.criar_cor(r, v, a)) }
    funcao texto(inteiro x, inteiro y, inteiro tamanho, cadeia s)
    {
        g.definir_tamanho_texto(tamanho * 1.0) g.desenhar_texto(x, y, s)
    }
    funcao lancar(inteiro i)
    {
        fruta_x[i] = u.sorteia(20, 80) / 100.0 fruta_y[i] = 1.15
        vx[i] = (0.5 - fruta_x[i]) * 0.6 vy[i] = -1.15
        // A primeira fruta ensina o gesto; bombas aparecem depois do primeiro corte.
        bomba[i] = pontos > 0 e u.sorteia(0, 5) == 0 cortada[i] = falso
    }
    funcao reiniciar()
    {
        pontos = 0 vidas = 3 proxima = 0.0 indice = 0 cortando_antes = falso
        para (inteiro i = 0; i < 7; i++) { cortada[i] = verdadeiro efeito[i] = 0.0 }
    }
    funcao inicio()
    {
        g.iniciar_modo_grafico(verdadeiro)
        g.definir_titulo_janela("Corte Tropical — deslize para cortar")
        g.entrar_modo_tela_cheia()
        reiniciar() anterior = u.tempo_decorrido()
        enquanto (verdadeiro)
        {
            inteiro agora = u.tempo_decorrido()
            real dt = (agora - anterior) / 1000.0
            se (dt > 0.05) dt = 0.05
            anterior = agora largura = g.largura_janela() altura = g.altura_janela()
            inteiro campo = altura - 250
            logico enter = t.tecla_pressionada(t.TECLA_ENTER)
            se (enter e nao enter_antes) reiniciar()
            enter_antes = enter
            logico cortando = mouse.botao_pressionado(mouse.BOTAO_ESQUERDO)
            inteiro mx = mouse.posicao_x(), my = mouse.posicao_y()
            se (nao cortando_antes) { ultimo_x = mx ultimo_y = my }
            se (vidas > 0)
            {
                proxima -= dt
                se (proxima <= 0.0) { lancar(indice) indice = (indice + 1) % 7 proxima = 0.65 }
                para (inteiro i = 0; i < 7; i++)
                {
                    efeito[i] -= dt
                    se (nao cortada[i])
                    {
                        fruta_x[i] += vx[i] * dt fruta_y[i] += vy[i] * dt vy[i] += 1.1 * dt
                        real x = fruta_x[i] * largura, y = 110.0 + fruta_y[i] * campo
                        se (fruta_y[i] > 1.2 e vy[i] > 0.0)
                        {
                            cortada[i] = verdadeiro
                            se (nao bomba[i]) vidas--
                        }
                        real dx = (mx - ultimo_x) * 1.0, dy = (my - ultimo_y) * 1.0
                        real comprimento = dx * dx + dy * dy, f = 0.0
                        se (comprimento > 0.0) f = ((x - ultimo_x) * dx + (y - ultimo_y) * dy) / comprimento
                        se (f < 0.0) f = 0.0
                        se (f > 1.0) f = 1.0
                        dx = x - (ultimo_x + dx * f) dy = y - (ultimo_y + dy * f)
                        se (cortando e nao cortada[i] e dx * dx + dy * dy < 900.0)
                        {
                            cortada[i] = verdadeiro efeito[i] = 0.5 efeito_x[i] = fruta_x[i] efeito_y[i] = fruta_y[i]
                            se (bomba[i]) vidas-- senao pontos += 10
                        }
                    }
                    se (vidas < 0) vidas = 0
                }
            }
            cor(30, 24, 46) g.limpar()
            cor(255, 194, 126) texto(16, 14, 12, "ARCADE / DESLIZE PARA CORTAR")
            cor(255, 241, 224) texto(16, 34, 27, "CORTE TROPICAL")
            texto(16, 72, 16, "Pontos " + pontos + "   ·   Vidas " + vidas)
            cor(42, 33, 56)
            para (inteiro y = 110; y < altura; y += 48) g.desenhar_linha(0, y, largura, y)
            para (inteiro i = 0; i < 7; i++)
            {
                inteiro x = px(fruta_x[i] * largura), y = 110 + px(fruta_y[i] * campo)
                se (nao cortada[i])
                {
                    se (bomba[i]) cor(76, 79, 100)
                    senao se (i % 3 == 0) cor(255, 113, 126)
                    senao se (i % 3 == 1) cor(255, 183, 77)
                    senao cor(136, 217, 113)
                    g.desenhar_elipse(x - 25, y - 25, 50, 50, verdadeiro)
                    se (bomba[i])
                    {
                        cor(255, 208, 123) g.desenhar_linha(x + 8, y - 22, x + 17, y - 35)
                        cor(255, 118, 126) texto(x - 6, y - 14, 24, "!")
                    }
                    senao
                    {
                        cor(255, 235, 201) g.desenhar_elipse(x - 13, y - 14, 10, 8, verdadeiro)
                        cor(121, 181, 102) g.desenhar_elipse(x, y - 31, 17, 9, verdadeiro)
                    }
                }
                se (efeito[i] > 0.0)
                {
                    x = px(efeito_x[i] * largura) y = 110 + px(efeito_y[i] * campo)
                    se (bomba[i]) cor(255, 118, 126) senao cor(255, 208, 123)
                    inteiro raio = px((0.5 - efeito[i]) * 90.0)
                    g.desenhar_elipse(x - raio, y - raio, raio * 2, raio * 2, falso)
                    se (bomba[i]) texto(x - 14, y - 8, 18, "-1") senao texto(x - 14, y - 8, 18, "+10")
                }
            }
            se (cortando)
            {
                cor(255, 241, 224) g.desenhar_linha(ultimo_x, ultimo_y, mx, my)
                g.desenhar_elipse(mx - 7, my - 7, 14, 14, verdadeiro)
            }
            cor(218, 186, 178) texto(16, altura - 144, 12, "Corte frutas · Evite as bombas!")
            se (vidas <= 0)
            {
                cor(49, 35, 61) g.desenhar_retangulo(16, altura / 2 - 35, largura - 32, 92, verdadeiro, verdadeiro)
                cor(255, 208, 123) texto(30, altura / 2 - 20, 24, "FIM DA COLHEITA")
                cor(255, 241, 224) texto(30, altura / 2 + 15, 16, "Enter para tentar de novo")
            }
            ultimo_x = mx ultimo_y = my cortando_antes = cortando
            g.renderizar()
        }
    }
}
