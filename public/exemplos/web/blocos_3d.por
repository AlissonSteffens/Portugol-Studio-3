programa
{
    inclua biblioteca Graficos --> g
    inclua biblioteca Mouse --> mouse
    inclua biblioteca Teclado --> t
    inclua biblioteca Matematica --> m
    inclua biblioteca Tipos --> tipos
    inclua biblioteca Util --> u

    /* Um mundo de cubos em perspectiva, inspirado em Minecraft.
     * Clique para capturar o mouse; mova o mouse para olhar.
     * WASD: mover. Setas também giram. Espaço: subir. Shift: descer.
     * Esc solta o mouse; Esc novamente encerra a execução.
     * Esquerdo: retirar o bloco da mira. Direito: colocar na face apontada.
     * 1-4: material. R: reconstruir. Esc: sair.
     * É um modo criativo: não há gravidade, inimigos nem inventário limitado.
     * Como Portugol possui vetores e matrizes, combinamos Z e Y na coluna:
     * mundo[x][z + y * TAMANHO]. Cada célula representa um cubo.
     */
    const inteiro TAMANHO = 8, ALTURA = 6, LARGURA_TELA = 900, ALTURA_TELA = 620
    inteiro mundo[TAMANHO][TAMANHO * ALTURA]
    real camera_x = 4.5, camera_y = 4.8, camera_z = -2.0
    real direcao = 0.0, inclinacao = -0.4
    real seno = 0.0, cosseno = 1.0, seno_vertical = 0.0, cosseno_vertical = 1.0
    inteiro escolhido = 1, retirados = 0, colocados = 0
    inteiro alvo_x = -1, alvo_y = -1, alvo_z = -1
    inteiro lugar_x = -1, lugar_y = -1, lugar_z = -1
    logico esquerdo_anterior = falso, direito_anterior = falso, reinicio_anterior = falso
    logico mudou = verdadeiro, interface_suja = verdadeiro
    inteiro buffer_cena = 0, buffer_interface = 0, buffer_picareta = 0
    real animacao_picareta = 0.0
    logico mouse_preso = falso
    // Buffers geométricos reutilizados por todas as faces, sem alocar por cubo.
    real vx[4], vy[4], vz[4], cx[6], cy[6], cz[6]
    inteiro pontos[6][2]
    // Os oito vértices e as seis faces de um cubo unitário.
    inteiro vertices[8][3] = {{0,0,0},{1,0,0},{1,1,0},{0,1,0},{0,0,1},{1,0,1},{1,1,1},{0,1,1}}
    inteiro faces[6][4] = {{3,2,6,7},{0,4,5,1},{0,1,2,3},{4,7,6,5},{0,3,7,4},{1,5,6,2}}
    inteiro vizinhos[6][3] = {{0,1,0},{0,-1,0},{0,0,-1},{0,0,1},{-1,0,0},{1,0,0}}
    inteiro ordem[TAMANHO * TAMANHO * ALTURA]
    real distancias[TAMANHO * TAMANHO * ALTURA]
    inteiro cubos_visiveis[TAMANHO * TAMANHO * ALTURA]
    inteiro faces_expostas[TAMANHO * TAMANHO * ALTURA][6]
    inteiro quantidade_cubos = 0
    logico geometria_suja = verdadeiro

    funcao inteiro piso(real valor)
    {
        inteiro resultado = tipos.real_para_inteiro(valor)
        se (valor < resultado) resultado--
        retorne resultado
    }

    funcao inteiro absoluto(inteiro valor)
    {
        se (valor < 0) retorne -valor
        retorne valor
    }

    funcao logico dentro(inteiro x, inteiro y, inteiro z)
    {
        retorne x >= 0 e x < TAMANHO e y >= 0 e y < ALTURA e z >= 0 e z < TAMANHO
    }

    funcao inteiro bloco(inteiro x, inteiro y, inteiro z)
    {
        se (nao dentro(x, y, z)) retorne 0
        retorne mundo[x][z + y * TAMANHO]
    }

    funcao gerar_mundo()
    {
        para (inteiro x = 0; x < TAMANHO; x++)
            para (inteiro z = 0; z < TAMANHO; z++)
                para (inteiro y = 0; y < ALTURA; y++)
                {
                    inteiro tipo = 0
                    se (y == 0) tipo = 2
                    se (y == 1) tipo = 5
                    se (y == 2) tipo = 1
                    se (x < 3 e z > 3 e z < 7)
                    {
                        se (y == 2) tipo = 5
                        se (y == 3) tipo = 1
                    }
                    mundo[x][z + y * TAMANHO] = tipo
                }
        mundo[6][5 + 3 * TAMANHO] = 3
        mundo[6][5 + 4 * TAMANHO] = 3
        para (inteiro x = 5; x <= 7; x++)
            para (inteiro z = 4; z <= 6; z++) mundo[x][z + 5 * TAMANHO] = 4
        camera_x = 4.5
        camera_y = 4.8
        camera_z = -2.0
        direcao = 0.0
        inclinacao = -0.4
        seno = m.seno(direcao)
        cosseno = m.cosseno(direcao)
        seno_vertical = m.seno(inclinacao)
        cosseno_vertical = m.cosseno(inclinacao)
        animacao_picareta = 0.0
        retirados = 0
        colocados = 0
        mudou = verdadeiro
        interface_suja = verdadeiro
        geometria_suja = verdadeiro
    }

    funcao cadeia nome_bloco(inteiro tipo)
    {
        se (tipo == 1) retorne "Grama"
        se (tipo == 2) retorne "Pedra"
        se (tipo == 3) retorne "Madeira"
        retorne "Folhas"
    }

    funcao inteiro cor_face(inteiro tipo, inteiro face)
    {
        inteiro vermelho = 131, verde = 89, azul = 60
        se (tipo == 1 e face == 0) { vermelho = 108 verde = 174 azul = 87 }
        se (tipo == 2) { vermelho = 128 verde = 142 azul = 156 }
        se (tipo == 3) { vermelho = 170 verde = 119 azul = 66 }
        se (tipo == 4) { vermelho = 68 verde = 143 azul = 83 }
        real luz = 0.75
        se (face == 0) luz = 1.0
        se (face == 2 ou face == 5) luz = 0.88
        retorne g.criar_cor(tipos.real_para_inteiro(vermelho * luz), tipos.real_para_inteiro(verde * luz), tipos.real_para_inteiro(azul * luz))
    }

    // Ordenamos do fundo para a frente: os cubos próximos cobrem os distantes.
    funcao ordenar(inteiro primeiro, inteiro fim)
    {
        inteiro esquerda = primeiro, direita = fim
        real pivo = distancias[(primeiro + fim) / 2]
        enquanto (esquerda <= direita)
        {
            enquanto (distancias[esquerda] > pivo) esquerda++
            enquanto (distancias[direita] < pivo) direita--
            se (esquerda <= direita)
            {
                real distancia = distancias[esquerda]
                distancias[esquerda] = distancias[direita]
                distancias[direita] = distancia
                inteiro indice = ordem[esquerda]
                ordem[esquerda] = ordem[direita]
                ordem[direita] = indice
                esquerda++
                direita--
            }
        }
        se (primeiro < direita) ordenar(primeiro, direita)
        se (esquerda < fim) ordenar(esquerda, fim)
    }

    /* Transformação da câmera e corte de cada face no plano próximo.
     * Dividir X e Y pela profundidade produz a perspectiva 3D.
     */
    funcao desenhar_face(inteiro x, inteiro y, inteiro z, inteiro face, inteiro tipo)
    {
        para (inteiro i = 0; i < 4; i++)
        {
            inteiro vertice = faces[face][i]
            real dx = x + vertices[vertice][0] - camera_x
            real dy = y + vertices[vertice][1] - camera_y
            real dz = z + vertices[vertice][2] - camera_z
            real profundidade = dx * seno + dz * cosseno
            vx[i] = dx * cosseno - dz * seno
            vy[i] = dy * cosseno_vertical - profundidade * seno_vertical
            vz[i] = dy * seno_vertical + profundidade * cosseno_vertical
        }
        inteiro quantidade = 0
        para (inteiro i = 0; i < 4; i++)
        {
            inteiro proximo = (i + 1) % 4
            se (vz[i] >= 0.15)
            {
                cx[quantidade] = vx[i]
                cy[quantidade] = vy[i]
                cz[quantidade] = vz[i]
                quantidade++
            }
            se ((vz[i] >= 0.15) != (vz[proximo] >= 0.15))
            {
                real fracao = (0.15 - vz[i]) / (vz[proximo] - vz[i])
                cx[quantidade] = vx[i] + (vx[proximo] - vx[i]) * fracao
                cy[quantidade] = vy[i] + (vy[proximo] - vy[i]) * fracao
                cz[quantidade] = 0.15
                quantidade++
            }
        }
        se (quantidade >= 3)
        {
            para (inteiro i = 0; i < quantidade; i++)
            {
                pontos[i][0] = tipos.real_para_inteiro(450.0 + cx[i] * 470.0 / cz[i])
                pontos[i][1] = tipos.real_para_inteiro(310.0 - cy[i] * 470.0 / cz[i])
            }
            // Repetir o último vértice permite usar uma matriz de tamanho fixo.
            para (inteiro i = quantidade; i < 6; i++)
            {
                pontos[i][0] = pontos[quantidade - 1][0]
                pontos[i][1] = pontos[quantidade - 1][1]
            }
            g.definir_cor(cor_face(tipo, face))
            g.desenhar_poligono(pontos, verdadeiro)
            g.definir_cor(g.criar_cor(53, 69, 64))
            se (x == alvo_x e y == alvo_y e z == alvo_z) g.definir_cor(g.criar_cor(255, 238, 161))
            g.desenhar_poligono(pontos, falso)
        }
    }

    // Este buffer de geometria muda apenas quando retiramos ou colocamos blocos.
    funcao atualizar_geometria()
    {
        quantidade_cubos = 0
        para (inteiro x = 0; x < TAMANHO; x++)
            para (inteiro z = 0; z < TAMANHO; z++)
                para (inteiro y = 0; y < ALTURA; y++)
                    se (bloco(x, y, z) != 0)
                    {
                        inteiro indice = x + z * TAMANHO + y * TAMANHO * TAMANHO
                        logico visivel = falso
                        para (inteiro face = 0; face < 6; face++)
                        {
                            faces_expostas[indice][face] = 0
                            se (bloco(x + vizinhos[face][0], y + vizinhos[face][1], z + vizinhos[face][2]) == 0)
                            {
                                faces_expostas[indice][face] = 1
                                visivel = verdadeiro
                            }
                        }
                        se (visivel)
                        {
                            cubos_visiveis[quantidade_cubos] = indice
                            quantidade_cubos++
                        }
                    }
        geometria_suja = falso
    }

    funcao desenhar_mundo()
    {
        se (geometria_suja) atualizar_geometria()
        g.usar_buffer(buffer_cena)
        g.definir_cor(g.criar_cor(153, 195, 215))
        g.limpar()
        inteiro quantidade = quantidade_cubos
        para (inteiro i = 0; i < quantidade; i++)
        {
            inteiro indice = cubos_visiveis[i]
            ordem[i] = indice
            inteiro x = indice % TAMANHO, z = (indice / TAMANHO) % TAMANHO, y = indice / (TAMANHO * TAMANHO)
            real dx = x + 0.5 - camera_x, dy = y + 0.5 - camera_y, dz = z + 0.5 - camera_z
            distancias[i] = dx * dx + dy * dy + dz * dz
        }
        se (quantidade > 1) ordenar(0, quantidade - 1)
        para (inteiro i = 0; i < quantidade; i++)
        {
            inteiro indice = ordem[i]
            inteiro x = indice % TAMANHO, z = (indice / TAMANHO) % TAMANHO, y = indice / (TAMANHO * TAMANHO)
            para (inteiro face = 0; face < 6; face++)
            {
                logico de_frente = (face == 0 e camera_y > y + 1) ou (face == 1 e camera_y < y) ou (face == 2 e camera_z < z) ou (face == 3 e camera_z > z + 1) ou (face == 4 e camera_x < x) ou (face == 5 e camera_x > x + 1)
                se (de_frente e faces_expostas[indice][face] == 1)
                    desenhar_face(x, y, z, face, mundo[x][z + y * TAMANHO])
            }
        }
        g.usar_buffer(0)
    }

    // Percorre o raio da mira até encontrar o primeiro bloco, a até 8 metros.
    funcao apontar()
    {
        alvo_x = -1
        lugar_x = -1
        inteiro anterior_x = piso(camera_x), anterior_y = piso(camera_y), anterior_z = piso(camera_z)
        para (inteiro passo = 1; passo <= 160; passo++)
        {
            real distancia = passo * 0.05
            inteiro x = piso(camera_x + seno * cosseno_vertical * distancia)
            inteiro y = piso(camera_y + seno_vertical * distancia)
            inteiro z = piso(camera_z + cosseno * cosseno_vertical * distancia)
            se (bloco(x, y, z) != 0)
            {
                alvo_x = x
                alvo_y = y
                alvo_z = z
                // Só colocamos na célula vizinha da face atingida.
                inteiro vizinhanca = absoluto(x - anterior_x) + absoluto(y - anterior_y) + absoluto(z - anterior_z)
                se (vizinhanca == 1 e dentro(anterior_x, anterior_y, anterior_z))
                {
                    lugar_x = anterior_x
                    lugar_y = anterior_y
                    lugar_z = anterior_z
                }
                pare
            }
            anterior_x = x
            anterior_y = y
            anterior_z = z
        }
    }

    funcao mover(real dx, real dy, real dz)
    {
        real x = camera_x + dx, y = camera_y + dy, z = camera_z + dz
        se (x > -3.0 e x < TAMANHO + 3.0 e z > -3.0 e z < TAMANHO + 3.0 e y > 0.1 e y < ALTURA + 4.0 e bloco(piso(x), piso(y), piso(z)) == 0)
        {
            camera_x = x
            camera_y = y
            camera_z = z
            mudou = verdadeiro
        }
    }

    // Picareta desenhada uma vez em um buffer transparente, em estilo voxel.
    funcao criar_picareta()
    {
        buffer_picareta = g.criar_buffer(270, 240)
        g.usar_buffer(buffer_picareta)
        inteiro cabo[4][2] = {{65,198},{82,210},{184,80},{168,66}}
        g.definir_cor(g.criar_cor(72, 47, 30))
        g.desenhar_poligono(cabo, verdadeiro)
        inteiro madeira[4][2] = {{72,193},{79,198},{175,78},{170,74}}
        g.definir_cor(g.criar_cor(166, 115, 59))
        g.desenhar_poligono(madeira, verdadeiro)
        inteiro borda[10][2] = {{111,35},{172,43},{203,59},{234,88},{222,106},{190,79},{162,68},{105,55},{94,49},{98,36}}
        g.definir_cor(g.criar_cor(23, 64, 65))
        g.desenhar_poligono(borda, verdadeiro)
        inteiro lamina[10][2] = {{111,40},{169,48},{200,64},{228,89},{220,97},{187,73},{160,62},{107,50},{101,46},{104,41}}
        g.definir_cor(g.criar_cor(57, 190, 181))
        g.desenhar_poligono(lamina, verdadeiro)
        g.definir_cor(g.criar_cor(126, 231, 211))
        g.desenhar_retangulo(113, 41, 41, 5, falso, verdadeiro)
        g.desenhar_retangulo(174, 54, 17, 5, falso, verdadeiro)
        // Mão e manga do personagem em primeira pessoa.
        inteiro mao[4][2] = {{62,179},{104,199},{87,237},{44,215}}
        g.definir_cor(g.criar_cor(215, 165, 120))
        g.desenhar_poligono(mao, verdadeiro)
        inteiro manga[4][2] = {{89,211},{128,231},{121,240},{75,240}}
        g.definir_cor(g.criar_cor(51, 103, 145))
        g.desenhar_poligono(manga, verdadeiro)
        g.usar_buffer(0)
    }

    funcao desenhar_picareta()
    {
        real balanco = m.seno(animacao_picareta * 3.14159)
        inteiro x = tipos.real_para_inteiro(612.0 - balanco * 64.0)
        inteiro y = tipos.real_para_inteiro(315.0 + balanco * 28.0)
        g.definir_rotacao(tipos.real_para_inteiro(-balanco * 18.0))
        g.desenhar_buffer(x, y, buffer_picareta)
        g.definir_rotacao(0)
    }

    funcao desenhar_interface()
    {
        g.limpar_buffer(buffer_interface)
        g.usar_buffer(buffer_interface)
        g.definir_cor(g.criar_cor(29, 39, 48))
        g.desenhar_retangulo(0, 0, 900, 78, falso, verdadeiro)
        g.desenhar_retangulo(0, 562, 900, 58, falso, verdadeiro)
        g.definir_cor(g.criar_cor(234, 238, 222))
        g.definir_tamanho_texto(21.0)
        g.desenhar_texto(24, 15, "MUNDO DE BLOCOS / 3D")
        g.definir_tamanho_texto(12.0)
        g.desenhar_texto(24, 46, "WASD: mover   Mouse / setas: olhar   Espaço / Shift: subir / descer   R: reiniciar   Esc: soltar / sair")
        g.desenhar_texto(24, 582, "1 Grama   2 Pedra   3 Madeira   4 Folhas     |     " + nome_bloco(escolhido))
        g.desenhar_texto(24, 601, "Esquerdo: retirar   Direito: colocar     |     Retirados: " + retirados + "   Colocados: " + colocados)
        g.definir_cor(g.criar_cor(255, 248, 224))
        g.desenhar_linha(440, 310, 460, 310)
        g.desenhar_linha(450, 300, 450, 320)
        se (alvo_x == -1) g.desenhar_texto(588, 582, "Aproxime-se de um bloco para editar")
        senao g.desenhar_texto(670, 582, "Alvo: " + alvo_x + ", " + alvo_y + ", " + alvo_z)
        se (nao mouse_preso)
        {
            g.definir_cor(g.criar_cor(29, 39, 48))
            g.desenhar_retangulo(246, 342, 410, 32, falso, verdadeiro)
            g.definir_cor(g.criar_cor(242, 223, 160))
            g.desenhar_texto(265, 352, "Clique no jogo para controlar a câmera com o mouse")
        }
        g.usar_buffer(0)
    }

    funcao inicio()
    {
        g.iniciar_modo_grafico()
        g.definir_dimensoes_janela(LARGURA_TELA, ALTURA_TELA)
        g.definir_titulo_janela("Mundo de blocos 3D")
        buffer_cena = g.criar_buffer(LARGURA_TELA, ALTURA_TELA)
        buffer_interface = g.criar_buffer(LARGURA_TELA, ALTURA_TELA)
        criar_picareta()
        mouse.capturar_cursor()
        gerar_mundo()
        inteiro ultimo_tempo = u.tempo_decorrido()
        enquanto (nao t.tecla_pressionada(t.TECLA_ESC))
        {
            inteiro agora = u.tempo_decorrido()
            real intervalo = (agora - ultimo_tempo) / 1000.0
            ultimo_tempo = agora
            se (intervalo > 0.08) intervalo = 0.08
            se (animacao_picareta > 0.0) animacao_picareta -= intervalo * 4.0
            se (animacao_picareta < 0.0) animacao_picareta = 0.0
            logico capturado = mouse.cursor_capturado()
            se (capturado != mouse_preso) { mouse_preso = capturado interface_suja = verdadeiro }
            inteiro movimento_x = mouse.movimento_x(), movimento_y = mouse.movimento_y()
            se (movimento_x != 0 ou movimento_y != 0)
            {
                direcao += movimento_x * 0.0025
                inclinacao -= movimento_y * 0.0025
                mudou = verdadeiro
            }
            real velocidade = intervalo * 3.0
            se (t.tecla_pressionada(t.TECLA_SETA_ESQUERDA)) { direcao -= intervalo * 1.5 mudou = verdadeiro }
            se (t.tecla_pressionada(t.TECLA_SETA_DIREITA)) { direcao += intervalo * 1.5 mudou = verdadeiro }
            se (t.tecla_pressionada(t.TECLA_SETA_ACIMA)) { inclinacao += intervalo mudou = verdadeiro }
            se (t.tecla_pressionada(t.TECLA_SETA_ABAIXO)) { inclinacao -= intervalo mudou = verdadeiro }
            se (inclinacao > 1.2) inclinacao = 1.2
            se (inclinacao < -1.2) inclinacao = -1.2
            seno = m.seno(direcao)
            cosseno = m.cosseno(direcao)
            seno_vertical = m.seno(inclinacao)
            cosseno_vertical = m.cosseno(inclinacao)
            se (t.tecla_pressionada(t.TECLA_W)) mover(seno * velocidade, 0.0, cosseno * velocidade)
            se (t.tecla_pressionada(t.TECLA_S)) mover(-seno * velocidade, 0.0, -cosseno * velocidade)
            se (t.tecla_pressionada(t.TECLA_A)) mover(-cosseno * velocidade, 0.0, seno * velocidade)
            se (t.tecla_pressionada(t.TECLA_D)) mover(cosseno * velocidade, 0.0, -seno * velocidade)
            se (t.tecla_pressionada(t.TECLA_ESPACO)) mover(0.0, velocidade, 0.0)
            se (t.tecla_pressionada(t.TECLA_SHIFT)) mover(0.0, -velocidade, 0.0)
            inteiro anterior = escolhido
            se (t.tecla_pressionada(t.TECLA_1)) escolhido = 1
            se (t.tecla_pressionada(t.TECLA_2)) escolhido = 2
            se (t.tecla_pressionada(t.TECLA_3)) escolhido = 3
            se (t.tecla_pressionada(t.TECLA_4)) escolhido = 4
            se (anterior != escolhido) interface_suja = verdadeiro
            logico reinicio = t.tecla_pressionada(t.TECLA_R)
            se (reinicio e nao reinicio_anterior) gerar_mundo()
            reinicio_anterior = reinicio
            se (mudou) apontar()
            logico esquerdo = mouse.botao_pressionado(mouse.BOTAO_ESQUERDO)
            logico direito = mouse.botao_pressionado(mouse.BOTAO_DIREITO)
            se (esquerdo e nao esquerdo_anterior) animacao_picareta = 1.0
            se (esquerdo e nao esquerdo_anterior e alvo_x != -1)
            {
                mundo[alvo_x][alvo_z + alvo_y * TAMANHO] = 0
                retirados++
                geometria_suja = verdadeiro
                mudou = verdadeiro
            }
            senao se (direito e nao direito_anterior e lugar_x != -1 e bloco(lugar_x, lugar_y, lugar_z) == 0)
            {
                se (lugar_x != piso(camera_x) ou lugar_y != piso(camera_y) ou lugar_z != piso(camera_z))
                {
                    mundo[lugar_x][lugar_z + lugar_y * TAMANHO] = escolhido
                    colocados++
                    animacao_picareta = 0.7
                    geometria_suja = verdadeiro
                    mudou = verdadeiro
                }
            }
            esquerdo_anterior = esquerdo
            direito_anterior = direito
            se (mudou)
            {
                apontar()
                desenhar_mundo()
                interface_suja = verdadeiro
                mudou = falso
            }
            se (interface_suja)
            {
                desenhar_interface()
                interface_suja = falso
            }
            g.desenhar_buffer(0, 0, buffer_cena)
            g.desenhar_buffer(0, 0, buffer_interface)
            desenhar_picareta()
            g.renderizar()
        }
        mouse.soltar_cursor()
        g.liberar_buffer(buffer_picareta)
        g.liberar_buffer(buffer_cena)
        g.liberar_buffer(buffer_interface)
        g.encerrar_modo_grafico()
    }
}
