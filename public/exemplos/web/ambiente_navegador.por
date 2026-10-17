programa
{
    inclua biblioteca Navegador --> nav

    /* Esta biblioteca é exclusiva da versão Web.
     * Execute no computador e no celular para comparar os resultados.
     * Gire o aparelho ou redimensione a janela e execute novamente.
     */
    funcao inicio()
    {
        escreva("MEU AMBIENTE DE EXECUÇÃO\n\n")
        escreva("Navegador: ", nav.obter_nome(), "\n")
        escreva("Sistema operacional: ", nav.obter_sistema_operacional(), "\n")
        escreva("Celular: ", nav.eh_celular(), "\n")
        escreva("Tablet: ", nav.eh_tablet(), "\n")
        escreva("Suporta toque: ", nav.suporta_toque(), "\n")
        escreva("Mouse ou apontador preciso: ", nav.possui_mouse(), "\n")
        escreva("Janela: ", nav.largura_janela(), " x ", nav.altura_janela(), " pixels CSS\n")
        escreva("Tela: ", nav.largura_tela(), " x ", nav.altura_tela(), " pixels CSS\n")
        escreva("Densidade de pixels: ", nav.densidade_pixels(), "\n")
        escreva("Orientação da janela: ", nav.obter_orientacao(), "\n")
        escreva("Idioma: ", nav.obter_idioma(), "\n")
        escreva("Rede informada como online: ", nav.esta_online(), "\n\n")

        // Escolha controles pelos recursos, pois computadores também podem ter toque.
        se (nav.suporta_toque())
        {
            escreva("Este ambiente permite oferecer joystick e botões de toque.\n")
        }
        se (nav.possui_mouse())
        {
            escreva("Este ambiente também oferece um apontador preciso.\n")
        }
        se (nav.largura_janela() < 600)
        {
            escreva("A janela é estreita: um layout compacto pode funcionar melhor.\n")
        }
        escreva("\nA identificação de dispositivo e sistema é aproximada.\n")
        escreva("Estar online não garante acesso a um site específico.\n")
    }
}
