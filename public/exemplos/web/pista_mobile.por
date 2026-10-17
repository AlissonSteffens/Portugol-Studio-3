programa
{
    inclua biblioteca Graficos --> g
    inclua biblioteca Teclado --> t
    inclua biblioteca Util --> u
    inclua biblioteca Tipos --> tipos

    /* PISTA NEON — corrida de três pistas, inspirada nos runners de celular.
     * Joystick/setas: trocar de pista. Espaço: saltar as barreiras.
     * Pegue moedas, sobreviva e tente superar a pontuação. Enter reinicia.
     * Todo o cenário acompanha a tela cheia e a rotação do dispositivo.
     */
    inteiro pista = 1, pontos = 0, vidas = 3, anterior = 0
    inteiro obstaculo_pista[6], moeda[6], largura = 0, altura = 0
    real distancia[6], salto = 0.0, tempo = 0.0, invencivel = 0.0
    logico esquerda_antes = falso, direita_antes = falso, pulo_antes = falso, enter_antes = falso

    funcao inteiro px(real v) { retorne tipos.real_para_inteiro(v) }
    funcao cor(inteiro r, inteiro v, inteiro a) { g.definir_cor(g.criar_cor(r, v, a)) }
    funcao texto(inteiro x, inteiro y, inteiro tamanho, cadeia s)
    {
        g.definir_tamanho_texto(tamanho * 1.0) g.desenhar_texto(x, y, s)
    }
    funcao reiniciar()
    {
        pista = 1 pontos = 0 vidas = 3 salto = 0.0 tempo = 0.0 invencivel = 0.0
        para (inteiro i = 0; i < 6; i++)
        {
            distancia[i] = -0.25 - i * 0.32
            obstaculo_pista[i] = u.sorteia(0, 2)
            moeda[i] = i % 2
        }
    }
    funcao inicio()
    {
        g.iniciar_modo_grafico(verdadeiro)
        g.definir_titulo_janela("Pista Neon — corrida de bolso")
        g.entrar_modo_tela_cheia()
        reiniciar() anterior = u.tempo_decorrido()
        enquanto (verdadeiro)
        {
            inteiro agora = u.tempo_decorrido()
            real dt = (agora - anterior) / 1000.0
            se (dt > 0.05) dt = 0.05
            anterior = agora
            largura = g.largura_janela() altura = g.altura_janela()
            inteiro topo = 100, fim = altura - 150, faixa = (largura - 32) / 3
            logico esquerda = t.tecla_pressionada(t.TECLA_SETA_ESQUERDA)
            logico direita = t.tecla_pressionada(t.TECLA_SETA_DIREITA)
            logico pulo = t.tecla_pressionada(t.TECLA_ESPACO)
            logico enter = t.tecla_pressionada(t.TECLA_ENTER)
            se (enter e nao enter_antes) reiniciar()
            enter_antes = enter
            se (vidas > 0)
            {
                tempo += dt
                se (esquerda e nao esquerda_antes e pista > 0) pista--
                se (direita e nao direita_antes e pista < 2) pista++
                se (pulo e nao pulo_antes e salto <= 0.0) salto = 0.85
                salto -= dt invencivel -= dt
                para (inteiro i = 0; i < 6; i++)
                {
                    real antes = distancia[i]
                    distancia[i] += dt * (0.36 + tempo * 0.002)
                    se (antes < 0.88 e distancia[i] >= 0.88 e obstaculo_pista[i] == pista)
                    {
                        se (moeda[i] == 1) pontos += 50
                        senao se (salto <= 0.0 e invencivel <= 0.0) { vidas-- invencivel = 1.0 }
                        senao pontos += 10
                    }
                    se (distancia[i] > 1.15)
                    {
                        distancia[i] -= 1.92
                        obstaculo_pista[i] = u.sorteia(0, 2) moeda[i] = u.sorteia(0, 1)
                    }
                }
            }
            esquerda_antes = esquerda direita_antes = direita pulo_antes = pulo
            cor(12, 10, 30) g.limpar()
            cor(174, 130, 255) texto(16, 14, 12, "ARCADE / CORRIDA DE BOLSO")
            cor(248, 240, 255) texto(16, 34, 27, "PISTA NEON")
            texto(16, 72, 16, "Pontos " + pontos + "   ·   Vidas " + vidas)
            para (inteiro i = 0; i < 3; i++)
            {
                cor(28 + i * 4, 23, 52)
                g.desenhar_retangulo(16 + i * faixa, topo, faixa - 3, altura - topo, falso, verdadeiro)
                cor(115, 68, 184)
                g.desenhar_linha(16 + i * faixa, topo, 16 + i * faixa, altura)
                para (inteiro j = 0; j < 12; j++)
                {
                    inteiro y = topo + (j * 70 + px(tempo * 190.0)) % (altura - topo)
                    cor(65, 49, 94) g.desenhar_retangulo(14 + i * faixa + faixa / 2, y, 3, 22, falso, verdadeiro)
                }
            }
            para (inteiro i = 0; i < 6; i++)
            {
                se (distancia[i] >= 0.0 e distancia[i] <= 1.15)
                {
                    inteiro x = 16 + obstaculo_pista[i] * faixa + faixa / 2
                    inteiro y = topo + px(distancia[i] * (fim - topo))
                    se (moeda[i] == 1)
                    {
                        cor(255, 202, 85) g.desenhar_elipse(x - 12, y - 12, 24, 24, verdadeiro)
                        cor(255, 240, 170) texto(x - 4, y - 10, 16, "+")
                    }
                    senao
                    {
                        cor(255, 95, 137) g.desenhar_retangulo(x - faixa / 3, y - 10, faixa * 2 / 3, 24, verdadeiro, verdadeiro)
                        cor(255, 195, 211) g.desenhar_linha(x - faixa / 3, y - 5, x + faixa / 3, y - 5)
                    }
                }
            }
            inteiro x = 16 + pista * faixa + faixa / 2, y = topo + px(0.88 * (fim - topo))
            cor(7, 5, 20) g.desenhar_elipse(x - 20, y + 10, 40, 12, verdadeiro)
            se (salto > 0.0) y -= px(salto * 65.0)
            se (invencivel <= 0.0 ou px(tempo * 12.0) % 2 == 0)
            {
                cor(115, 255, 226) g.desenhar_retangulo(x - 15, y - 24, 30, 38, verdadeiro, verdadeiro)
                cor(20, 65, 81) g.desenhar_retangulo(x - 10, y - 17, 20, 10, verdadeiro, verdadeiro)
            }
            cor(203, 184, 231) texto(16, altura - 144, 12, "Troque de pista · Espaço: saltar")
            se (vidas <= 0)
            {
                cor(25, 17, 49) g.desenhar_retangulo(16, altura / 2 - 35, largura - 32, 92, verdadeiro, verdadeiro)
                cor(255, 202, 85) texto(30, altura / 2 - 20, 24, "FIM DA CORRIDA")
                cor(248, 240, 255) texto(30, altura / 2 + 15, 16, "Enter para tentar de novo")
            }
            g.renderizar()
        }
    }
}
