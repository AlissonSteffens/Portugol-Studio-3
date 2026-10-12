// Contratos gerados a partir das bibliotecas Java do projeto.
export default {
  "Objetos": {
    "finalizar": {
      "type": "vazio",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": []
    },
    "criar_objeto_via_json": {
      "type": "inteiro",
      "description": "Realiza a criação de um objeto a partir de uma cadeia no formato JSON (JavaScript Object Notation)",
      "returns": "O endereço de memória no qual o objeto foi carregada",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "json",
          "description": "texto no formato JSON para criar o objeto"
        }
      ]
    },
    "criar_objeto_via_xml": {
      "type": "inteiro",
      "description": "Realiza a criação de um objeto a partir de uma cadeia no formato XML (eXtensible Markup Language)",
      "returns": "O endereço de memória no qual o objeto foi carregada",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "xml",
          "description": "texto no formato XML para criar o objeto"
        }
      ]
    },
    "criar_objeto": {
      "type": "inteiro",
      "description": "Realiza a criação de um objeto vazio em memória",
      "returns": "O endereço de memória no qual o objeto foi carregada",
      "available": true,
      "parameters": []
    },
    "atribuir_propriedade": {
      "type": "vazio",
      "description": "Realiza a atribuição de uma propriedade do objeto no endereço informado",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço onde o objeto foi armazenado"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "propriedade",
          "description": "a descrição da propriedade que terá o valor alterado"
        },
        {
          "type": "todos",
          "dimensions": 0,
          "name": "valor",
          "description": "o valor que será atribuido para a propriedade"
        }
      ]
    },
    "obter_propriedade_tipo_inteiro": {
      "type": "inteiro",
      "description": "Obtém o valor de uma propriedade do tipo inteiro no objeto do endereço informado",
      "returns": "o valor da propriedade informada",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço onde o objeto foi armazenado"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "propriedade",
          "description": "a descrição da propriedade que terá o valor obtido"
        }
      ]
    },
    "obter_propriedade_tipo_real": {
      "type": "real",
      "description": "Obtém o valor de uma propriedade do tipo real no objeto do endereço informado",
      "returns": "o valor da propriedade informada",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço onde o objeto foi armazenado"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "propriedade",
          "description": "a descrição da propriedade que terá o valor obtido"
        }
      ]
    },
    "obter_propriedade_tipo_logico": {
      "type": "logico",
      "description": "Obtém o valor de uma propriedade do tipo logico no objeto do endereço informado",
      "returns": "o valor da propriedade informada",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço onde o objeto foi armazenado"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "propriedade",
          "description": "a descrição da propriedade que terá o valor obtido"
        }
      ]
    },
    "obter_propriedade_tipo_caracter": {
      "type": "caracter",
      "description": "Obtém o valor de uma propriedade do tipo caracter no objeto do endereço informado",
      "returns": "o valor da propriedade informada",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço onde o objeto foi armazenado"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "propriedade",
          "description": "a descrição da propriedade que terá o valor obtido"
        }
      ]
    },
    "obter_propriedade_tipo_cadeia": {
      "type": "cadeia",
      "description": "Obtém o valor de uma propriedade do tipo cadeia no objeto do endereço informado",
      "returns": "o valor da propriedade informada",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço onde o objeto foi armazenado"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "propriedade",
          "description": "a descrição da propriedade que terá o valor obtido"
        }
      ]
    },
    "obter_propriedade_tipo_objeto": {
      "type": "inteiro",
      "description": "Obtém o valor de uma propriedade do tipo objeto no objeto do endereço informado",
      "returns": "o valor da propriedade informada",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço onde o objeto foi armazenado"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "propriedade",
          "description": "a descrição da propriedade que terá o valor obtido"
        }
      ]
    },
    "obter_propriedade_tipo_objeto_em_vetor": {
      "type": "inteiro",
      "description": "Obtém o valor de um vetor armazenado no objeto do endereço informado",
      "returns": "o valor da propriedade informada",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço onde o objeto foi armazenado"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "propriedade",
          "description": "a descrição da propriedade que terá o valor obtido"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "indice",
          "description": "o índice do elemento do vetor que será obtido"
        }
      ]
    },
    "obter_propriedade_tipo_caracter_em_vetor": {
      "type": "caracter",
      "description": "Obtém o valor de um vetor armazenado no objeto do endereço informado",
      "returns": "o valor da propriedade informada",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço onde o objeto foi armazenado"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "propriedade",
          "description": "a descrição da propriedade que terá o valor obtido"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "indice",
          "description": "o índice do elemento do vetor que será obtido"
        }
      ]
    },
    "obter_propriedade_tipo_logico_em_vetor": {
      "type": "logico",
      "description": "Obtém o valor de um vetor armazenado no objeto do endereço informado",
      "returns": "o valor da propriedade informada",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço onde o objeto foi armazenado"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "propriedade",
          "description": "a descrição da propriedade que terá o valor obtido"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "indice",
          "description": "o índice do elemento do vetor que será obtido"
        }
      ]
    },
    "obter_propriedade_tipo_real_em_vetor": {
      "type": "real",
      "description": "Obtém o valor de um vetor armazenado no objeto do endereço informado",
      "returns": "o valor da propriedade informada",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço onde o objeto foi armazenado"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "propriedade",
          "description": "a descrição da propriedade que terá o valor obtido"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "indice",
          "description": "o índice do elemento do vetor que será obtido"
        }
      ]
    },
    "obter_propriedade_tipo_inteiro_em_vetor": {
      "type": "inteiro",
      "description": "Obtém o valor de um vetor armazenado no objeto do endereço informado",
      "returns": "o valor da propriedade informada",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço onde o objeto foi armazenado"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "propriedade",
          "description": "a descrição da propriedade que terá o valor obtido"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "indice",
          "description": "o índice do elemento do vetor que será obtido"
        }
      ]
    },
    "obter_propriedade_tipo_cadeia_em_vetor": {
      "type": "cadeia",
      "description": "Obtém o valor de um vetor armazenado no objeto do endereço informado",
      "returns": "o valor da propriedade informada",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço onde o objeto foi armazenado"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "propriedade",
          "description": "a descrição da propriedade que terá o valor obtido"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "indice",
          "description": "o índice do elemento do vetor que será obtido"
        }
      ]
    },
    "obter_tamanho_vetor_propriedade": {
      "type": "inteiro",
      "description": "Obtém o tamanho de um vetor armazenado no objeto do endereço informado",
      "returns": "o valor da propriedade informada",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço onde o objeto foi armazenado"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "propriedade",
          "description": "a descrição da propriedade que terá o valor obtido"
        }
      ]
    },
    "liberar_objeto": {
      "type": "vazio",
      "description": "Libera o objeto do endereço informado da memória",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço onde o objeto foi armazenado"
        }
      ]
    },
    "liberar": {
      "type": "vazio",
      "description": "Libera todos os objetos previamente armazenados na memória",
      "returns": "",
      "available": true,
      "parameters": []
    },
    "obter_json": {
      "type": "cadeia",
      "description": "Obtém a cadeia que representa o objeto inteiro no formato JSON (JavaScript Object Notation)",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço onde o objeto foi armazenado"
        }
      ]
    },
    "contem_propriedade": {
      "type": "logico",
      "description": "Identifica se o objeto contém ou não a propriedade informada",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço onde o objeto foi armazenado"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "propriedade",
          "description": "propriedade utilizada para verificação"
        }
      ]
    },
    "tipo_propriedade": {
      "type": "inteiro",
      "description": "Identifica o tipo da propriedade informada",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço onde o objeto foi armazenado"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "propriedade",
          "description": "propriedade utilizada para verificação"
        }
      ]
    }
  },
  "ServicosWeb": {
    "obter_dados": {
      "type": "cadeia",
      "description": "Realiza uma chamada HTTP GET para o endereço especificado, retornando uma cadeia no formato JSON como resposta",
      "returns": "a cadeia JSON contendo a resposta da requisição",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "endereco",
          "description": "endereço para o qual a requisição será feita"
        }
      ]
    },
    "excluir_dados": {
      "type": "cadeia",
      "description": "Realiza uma chamada HTTP DELETE para o endereço especificado, retornando uma cadeia no formato JSON como resposta",
      "returns": "a cadeia JSON contendo a resposta da requisição",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "endereco",
          "description": "endereço para o qual a requisição será feita"
        }
      ]
    },
    "publicar_dados": {
      "type": "cadeia",
      "description": "Realiza uma chamada HTTP POST para o endereço especificado, retornando uma cadeia no formato JSON como resposta",
      "returns": "a cadeia JSON contendo a resposta da requisição",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "endereco",
          "description": "endereço para o qual a requisição será feita"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "objeto",
          "description": "objeto no formato JSON passado por parâmetro no corpo da requisição"
        }
      ]
    },
    "atualizar_dados": {
      "type": "cadeia",
      "description": "Realiza uma chamada HTTP PUT para o endereço especificado, retornando uma cadeia no formato JSON como resposta",
      "returns": "a cadeia JSON contendo a resposta da requisição",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "endereco",
          "description": "endereço para o qual a requisição será feita"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "objeto",
          "description": "objeto no formato JSON passado por parâmetro no corpo da requisição"
        }
      ]
    },
    "abrir_conexao": {
      "type": "vazio",
      "description": "Abre uma conexão customizável com o endereço especificado.",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "endereco",
          "description": "endereço para o qual a requisição será feita"
        }
      ]
    },
    "adicionar_cabecalho": {
      "type": "vazio",
      "description": "Adiciona um cabeçalho na conexão customizável, para utilizar esta função é necessário abrir uma conexão antes.",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "chave",
          "description": "chave do cabeçalho que será incluído na conexão"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "valor",
          "description": "valor do cabeçalho que será incluído na conexão"
        }
      ]
    },
    "adicionar_parametros": {
      "type": "vazio",
      "description": "Adiciona um objeto no formato JSON na conexão customizável, para utilizar esta função é necessário abrir uma conexão antes. Esta função deve ser utilizada para informar os parâmetros dos métodos HTTP POST e PUT.",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "objeto",
          "description": "objeto no formato JSON passado por parâmetro no corpo da requisição"
        }
      ]
    },
    "fazer_requisicao": {
      "type": "cadeia",
      "description": "Realiza uma chamada HTTP através de uma conexão customizada, retornando uma cadeia no formato JSON como resposta",
      "returns": "a cadeia JSON contendo a resposta da requisição",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "metodoHttp",
          "description": "Método HTTP que será utilizado nesta execução (GET, POST, PUT ou DELETE)."
        }
      ]
    }
  },
  "Graficos": {
    "inicializar": {
      "type": "vazio",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": [
        {
          "type": "vazio",
          "dimensions": 0,
          "name": "parametro1",
          "description": ""
        },
        {
          "type": "vazio",
          "dimensions": 0,
          "name": "parametro2",
          "description": ""
        }
      ]
    },
    "finalizar": {
      "type": "vazio",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": []
    },
    "iniciar_modo_grafico": {
      "type": "vazio",
      "description": "Inicia o modo gráfico e exibe uma janela com as configurações padrão (tamanho 640x480 e fundo preto). Se o modo gráfico já estiver iniciado, nada acontecerá",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "logico",
          "dimensions": 0,
          "name": "manter_visivel",
          "description": "define se a janela do ambiente gráfico deve permanecer sempre visível sobre as outras janelas (útil durante a depuração)"
        }
      ]
    },
    "fechar_janela": {
      "type": "vazio",
      "description": "Encerra o programa como se o usuário tivesse clicado no botão 'Fechar' da janela",
      "returns": "",
      "available": true,
      "parameters": []
    },
    "minimizar_janela": {
      "type": "vazio",
      "description": "Minimiza a janela do ambiente gráfico, como se o usuário tivesse clicado no botão 'Minimizar' da janela",
      "returns": "",
      "available": true,
      "parameters": []
    },
    "restaurar_janela": {
      "type": "vazio",
      "description": "Restaura a janela do ambiente gráfico, como se o usuário tivesse clicado no ícone do programa na barra de tarefas do Sistema Operacional",
      "returns": "",
      "available": true,
      "parameters": []
    },
    "ocultar_borda_janela": {
      "type": "vazio",
      "description": "Oculta a borda da janela do modo gráfico, fazendo com que somente o conteúdo da janela seja exibido",
      "returns": "",
      "available": true,
      "parameters": []
    },
    "exibir_borda_janela": {
      "type": "vazio",
      "description": "Exibe novamente a borda da janela do modo gráfico, caso ela esteja oculta",
      "returns": "",
      "available": true,
      "parameters": []
    },
    "encerrar_modo_grafico": {
      "type": "vazio",
      "description": "Encerra o modo gráfico e fecha a janela criada com a função 'iniciar_modo_grafico'",
      "returns": "",
      "available": true,
      "parameters": []
    },
    "definir_dimensoes_janela": {
      "type": "vazio",
      "description": "altera as dimensões da janela do ambiente gráfico",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "largura",
          "description": "a nova largura da janela"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "altura",
          "description": "a nova altura da janela"
        }
      ]
    },
    "definir_titulo_janela": {
      "type": "vazio",
      "description": "define o texto da janela do ambiente gráfico",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "titulo",
          "description": "o novo título da janela"
        }
      ]
    },
    "limpar": {
      "type": "vazio",
      "description": "limpa o desenho do ambiente e gráfico e preenche o fundo com a cor atual",
      "returns": "",
      "available": true,
      "parameters": []
    },
    "renderizar": {
      "type": "vazio",
      "description": "Quando uma função de desenho da biblioteca é chamada, o desenho não é realizado imediatamente na tela, mas sim, em uma área reservada da memória. Isto é feito com o objetivo de aumentar o desempenho do programa e minimizar outros problemas. Esta técnica é chamada de Back Buffer ou Double Buffer.A função renderizar, faz com que os desenhos existentes no Back Buffer sejam desenhados na tela.Esta função deve ser chamada sempre após todas as outras funções de desenho, para garantir que todos os desenhos sejam exibidos",
      "returns": "",
      "available": true,
      "parameters": []
    },
    "renderizar_imagem": {
      "type": "inteiro",
      "description": "Esta função cria uma nova imagem em memória e renderiza todos os desenhos do ambiente gráfico nesta nova imagem ao invés de renderizá-los na tela",
      "returns": "o endereço de memória da nova imagem",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "largura",
          "description": "a largura da nova imagem"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "altura",
          "description": "a altura da nova imagem"
        }
      ]
    },
    "desenhar_retangulo": {
      "type": "vazio",
      "description": "Desenha um retângulo na posição definida pelos parâmetros x e y e com as dimensões especificadas pelos parâmetros largura e altura. O retângulo é desenhado na tela a partir do seu canto superior esquerdo",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "x",
          "description": "a posição (distância) do retângulo no eixo horizontal, em relação ao lado esquerdo da janela"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "y",
          "description": "a posição (distância) do retângulo no eixo vertical, em relação ao topo da janela"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "largura",
          "description": "a largura do retângulo em pixels"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "altura",
          "description": "a altura do retângulo em pixels"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "arredondar_cantos",
          "description": "define se o retângulo deverá ter cantos arredondados"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "preencher",
          "description": "define se o retângulo será preenchido com a cor do ambiente gráfico. Se o valor for verdadeiro, o retângulo será preenchido. Se o valor for falso, somente o contorno do retângulo será desenhado"
        }
      ]
    },
    "desenhar_poligono": {
      "type": "vazio",
      "description": "Desenha poligono",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 2,
          "name": "pontos",
          "description": "a largura do retângulo em pixels"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "preencher",
          "description": "define se o retângulo será preenchido com a cor do ambiente gráfico. Se o valor for verdadeiro, o retângulo será preenchido. Se o valor for falso, somente o contorno do retângulo será desenhado"
        }
      ]
    },
    "desenhar_elipse": {
      "type": "vazio",
      "description": "Desenha uma elipse na posição definida pelos parâmetros x e y e com as dimensões especificadas pelos parâmetros largura e altura, .A elipse é desenhada na tela a partir do seu canto superior esquerdo",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "x",
          "description": "a posição (distância) do círculo no eixo horizontal, em relação ao lado esquerdo da janela"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "y",
          "description": "a posição (distância) do círculo no eixo vertical, em relação ao topo da janela"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "largura",
          "description": "a largura da elipse em pixels"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "altura",
          "description": "a altura da elipse em pixels"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "preencher",
          "description": "define se a elipse será preenchida com a cor do ambiente gráfico. Se o valor for verdadeiro, a elipse será preenchida. Se o valor for falso, somente o contorno da elipse será desenhado"
        }
      ]
    },
    "desenhar_ponto": {
      "type": "vazio",
      "description": "Desenha um ponto na posição definida pelos parâmetros x e y.O ponto desenhado ocupa um único pixel na tela",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "x",
          "description": "a coordenada (distância) do ponto no eixo horizontal, em relação ao lado esquerdo da janela"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "y",
          "description": "a coordenada (distância) do ponto no eixo vertical, em relação ao topo da janela"
        }
      ]
    },
    "desenhar_linha": {
      "type": "vazio",
      "description": "Desenha uma linha de um ponto 'A' (definido pelos parâmetros x1 e y1) até um ponto 'B' (definido pelos parâmetros x2 e y2)",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "x1",
          "description": "a coordenada (distância) do ponto 'A' no eixo horizontal, em relação ao lado esquerdo da janela"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "y1",
          "description": "a coordenada (distância) do ponto 'A' no eixo vertical, em relação ao topo da janela"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "x2",
          "description": "a coordenada (distância) do ponto 'B' no eixo horizontal, em relação ao lado esquerdo da janela"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "y2",
          "description": "a coordenada (distância) do ponto 'B' no eixo vertical, em relação ao topo da janela"
        }
      ]
    },
    "carregar_imagem": {
      "type": "inteiro",
      "description": "Carrega uma imagem na memória para ser utilizada mais tarde. Os formatos de imagem suportados são: JPEG, PNG, BITMAP e GIF",
      "returns": "o endereço de memória no qual a imagem foi carregada",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "caminho",
          "description": "o caminho do arquivo de imagem no computador"
        }
      ]
    },
    "proximo_frame_gif": {
      "type": "vazio",
      "description": "Define a imagem a ser desenhada do gif como o próximo frame",
      "returns": "",
      "available": false,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória no qual o gif foi carregado"
        }
      ]
    },
    "transformar_imagem": {
      "type": "inteiro",
      "description": "Esta função permite transformar uma imagem previamente carregada no ambiente gráfico com a função carregar_imagem(). As transformações possíveis são: espelhamento, rotação e remoção de cor.O espelhamento permite inverter a imagem tanto na direção horizontal quanto na direção vertical.A rotação, permite girar e inclinar a imagem em um ângulo de 360 graus. A remoção de cor, permite escolher uma cor da imagem e torná-la transparente.Esta função cria uma cópia da imagem original antes de aplicar as transformações, portanto, a imagem original não é perdida ao realizar a transformação e a nova imagem é alocada em outro endereço de memória",
      "returns": "o endereço de memória da nova imagem",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória da imagem que será transformada"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "espelhamento_horizontal",
          "description": "define se a imagem será invertida (espelhada) na direção horizontal"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "espelhamento_vertical",
          "description": "define se a imagem será invertida (espelhada) na direção vertical"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "rotacao",
          "description": "define em quantos graus a imagem será rotacionada. Se o valor 0 for informado, a imagem não será rotacionada. É importante notar que, ao rotacionar a imagem, as suas dimensões (largura e altura) poderão se alterar"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "cor_transparente",
          "description": "define a cor que será removida da imagem, ou seja, que irá se tornar transparente. Se o valor 0 for informado, nenhuma cor será removida"
        }
      ]
    },
    "redimensionar_imagem": {
      "type": "inteiro",
      "description": "Esta função permite redimensionar uma imagem previamente carregada no ambiente gráfico com a função carregar_imagem().  Caso um dos parametros de dimensão seja 0, o outro parametro será proporcional ao dado",
      "returns": "o endereço de memória da nova imagem",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória da imagem que será transformada"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "largura",
          "description": "a largura desejada da imagem"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "altura",
          "description": "a altura desejada da imagem"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "manter_qualidade",
          "description": "define se a qualidade da imagem deve ser mantida ao redimensionar"
        }
      ]
    },
    "obter_cor_pixel": {
      "type": "inteiro",
      "description": "Esta função permite obter uma cor em um pixel expecifico de uma imagem previamente carregada no ambiente gráfico com a função carregar_imagem().",
      "returns": "cor RGB do pixel",
      "available": false,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória da imagem que será transformada"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "x",
          "description": "coluna do pixel no bitmap"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "y",
          "description": "linha do pixel no bitmap"
        }
      ]
    },
    "transformar_porcao_imagem": {
      "type": "inteiro",
      "description": "Esta função permite transformar uma porção de uma imagem previamente carregada no ambiente gráfico com a função carregar_imagem(). As transformações possíveis são: espelhamento, rotação e remoção de cor.O espelhamento permite inverter uma porção da imagem tanto na direção horizontal quanto na direção vertical.A rotação, permite girar e inclinar uma porção da imagem em um ângulo de 360 graus. A remoção de cor, permite escolher uma cor da imagem e torná-la transparente.Esta função copia uma porção da imagem original antes de aplicar as transformações, portanto, a imagem original não é perdida ao realizar a transformação e a nova imagem é alocada em outro endereço de memória",
      "returns": "",
      "available": false,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória da imagem que será transformada"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "x",
          "description": "a posição (distância) no eixo horizontal a partir da qual a imagem será transformada"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "y",
          "description": "a posição (distância) no eixo vertical a partir da qual a imagem será transformada"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "largura",
          "description": "a largura da porção da imagem a ser transformada"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "altura",
          "description": "a altura da porção da imagem a ser transformada"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "espelhamento_horizontal",
          "description": "define se a imagem será invertida (espelhada) na direção horizontal"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "espelhamento_vertical",
          "description": "define se a imagem será invertida (espelhada) na direção vertical"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "rotacao",
          "description": "define em quantos graus a imagem será rotacionada. Se o valor 0 for informado, a imagem não será rotacionada. É importante notar que, ao rotacionar a imagem, as suas dimensões (largura e altura) poderão se alterar"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "cor_transparente",
          "description": "define a cor que será removida da imagem, ou seja, que irá se tornar transparente. Se o valor 0 for informado, nenhuma cor será removida"
        }
      ]
    },
    "desenhar_imagem": {
      "type": "vazio",
      "description": "Desenha uma imagem previamente carregada, na posição especificada pelos parâmetros x e y",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "x",
          "description": "a posição (distância) da imagem no eixo horizontal, em relação ao lado esquerdo da janela"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "y",
          "description": "a posição (distância) da imagem no eixo vertical, em relação ao topo da janela"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória da imagem a ser desenhada"
        }
      ]
    },
    "salvar_imagem": {
      "type": "vazio",
      "description": "Salva uma imagem",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória da imagem a ser desenhada"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "caminho",
          "description": "lugar onde a imagem deverá sre salva"
        }
      ]
    },
    "desenhar_quadro_atual_gif": {
      "type": "vazio",
      "description": "Desenha um frame de um gif previamente carregado, na posição especificada pelos parâmetros x e y",
      "returns": "",
      "available": false,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "x",
          "description": "a posição (distância) da imagem no eixo horizontal, em relação ao lado esquerdo da janela"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "y",
          "description": "a posição (distância) da imagem no eixo vertical, em relação ao topo da janela"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória da imagem a ser desenhada"
        }
      ]
    },
    "desenhar_porcao_imagem": {
      "type": "vazio",
      "description": "Desenha uma porção de uma imagem previamente carregada, na posição especificada pelos parâmetros x e y",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "x",
          "description": "a posição (distância) da imagem no eixo horizontal, em relação ao lado esquerdo da janela"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "y",
          "description": "a posição (distância) da imagem no eixo vertical, em relação ao topo da janela"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "xi",
          "description": "a posição (distância) no eixo horizontal a partir da qual a imagem começará a ser desenhada"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "yi",
          "description": "a posição (distância) no eixo vertical a partir da qual a imagem começará a ser desenhada"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "largura",
          "description": "a largura da porção da imagem a ser desenhada"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "altura",
          "description": "a altura da porção da imagem a ser desenhada"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória da imagem a ser desenhada"
        }
      ]
    },
    "obter_intervalo_gif": {
      "type": "inteiro",
      "description": "Obtêm o intervalo entre os quadros de um gif",
      "returns": "intervalo em milissegundos do quadro atual",
      "available": false,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória do gif"
        }
      ]
    },
    "obter_numero_quadros_gif": {
      "type": "inteiro",
      "description": "Obtêm o numero de quadros de um gif",
      "returns": "o número de quadros que o gif possui",
      "available": false,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória do gif"
        }
      ]
    },
    "obter_numero_quadro_atual_gif": {
      "type": "inteiro",
      "description": "Obtêm o numero do quadro atual de um gif",
      "returns": "o número do quadro atual que o gif está",
      "available": false,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória do gif"
        }
      ]
    },
    "obter_quadro_gif": {
      "type": "inteiro",
      "description": "Obtêm determinado quadro de um gif",
      "returns": "imagem do quadro pedido por parâmetro",
      "available": false,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória do gif"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "quadro",
          "description": "o quadro que deseja obter"
        }
      ]
    },
    "definir_quadro_gif": {
      "type": "vazio",
      "description": "Define determinado quadro a um gif",
      "returns": "",
      "available": false,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória do gif"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "quadro",
          "description": "o quadro que deseja ser definido"
        }
      ]
    },
    "liberar_imagem": {
      "type": "vazio",
      "description": "Libera a memória utilizada por uma imagem que tenha sido previamente carregada",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória da imagem"
        }
      ]
    },
    "desenhar_texto": {
      "type": "vazio",
      "description": "Desenha um texto (cadeia) na posição especificada pelos parâmetros x e y",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "x",
          "description": "a posição (distância) do texto no eixo horizontal, em relação ao lado esquerdo da janela"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "y",
          "description": "a posição (distância) do ponto no eixo vertical, em relação ao topo da janela"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "texto",
          "description": "o texto (cadeia) a ser desenhado"
        }
      ]
    },
    "definir_cor": {
      "type": "vazio",
      "description": "Define a cor atual do ambiente gráfico. Esta cor será utilizada para desenhar e preencher as primitivas gráficas (ponto, linha, retângulo, etc.) e, como cor de fundo ao limpar o ambiente gráfico ou desenhar um texto",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "cor",
          "description": "a nova cor do ambiente gráfico"
        }
      ]
    },
    "definir_gradiente": {
      "type": "vazio",
      "description": "Define a cor atual do ambiente gráfico como um gradiente de 2 cores. Esta cor será utilizada para desenhar e preencher as primitivas gráficas (ponto, linha, retângulo, etc.) e, como cor de fundo ao limpar o ambiente gráfico",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "tipo",
          "description": "o tipo de rotação de gradiente que será utilizado"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "cor1",
          "description": "a primeira cor do novo gradiente do ambiente gráfico"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "cor2",
          "description": "a segunda cor do novo gradiente do ambiente gráfico"
        }
      ]
    },
    "definir_fonte_texto": {
      "type": "vazio",
      "description": "Define a fonte que será utilizada para desenhar um texto no ambiente gráfico",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "nome",
          "description": "o nome da fonte a ser utilizada (Ex.: Arial, Times New Roman, Tahoma). Se a fonte informada não existir no sistema operacional do computador, será utilizada a fonte padrão"
        }
      ]
    },
    "definir_tamanho_texto": {
      "type": "vazio",
      "description": "Define o tamanho da fonte que será utilizada para desenhar um texto no ambiente gráfico",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "real",
          "dimensions": 0,
          "name": "tamanho",
          "description": "o tamanho da fonte a ser utilizada"
        }
      ]
    },
    "definir_estilo_texto": {
      "type": "vazio",
      "description": "Define o estilo da fonte que será utilizada para desenhar um texto no ambiente gráfico",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "logico",
          "dimensions": 0,
          "name": "italico",
          "description": "define se a fonte terá o estilo itálico"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "negrito",
          "description": "define se a fonte terá o estilo negrito"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "sublinhado",
          "description": "define se a fonte terá o estilo sublinhado"
        }
      ]
    },
    "largura_texto": {
      "type": "inteiro",
      "description": "Obtém a largura em pixels que um texto ocupa para ser desenhado na tela",
      "returns": "a largura do texto",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "texto",
          "description": "o texto que será mensurado"
        }
      ]
    },
    "altura_texto": {
      "type": "inteiro",
      "description": "Obtém a altura em pixels que um texto ocupa para ser desenhado na tela",
      "returns": "a altura do texto",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "texto",
          "description": "o texto que será mensurado"
        }
      ]
    },
    "largura_imagem": {
      "type": "inteiro",
      "description": "Obtém a altura de uma imagem previamente carregada no ambiente gráfico",
      "returns": "a largura da imagem",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço da imagem para a qual se quer obter a largura"
        }
      ]
    },
    "altura_imagem": {
      "type": "inteiro",
      "description": "Obtém a altura de uma imagem previamente carregada no ambiente gráfico",
      "returns": "a altura da imagem",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço da imagem para a qual se quer obter a altura"
        }
      ]
    },
    "criar_cor": {
      "type": "inteiro",
      "description": "cria uma nova cor a partir da combinação de tons de vermelho, verde e azul",
      "returns": "a nova cor criada pela combinação dos tons de vermelho, verde e azul",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "vermelho",
          "description": "o tom de vermelho (0 a 255)"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "verde",
          "description": "o tom de verde (0 a 255)"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "azul",
          "description": "o tom de azul (0 a 255)"
        }
      ]
    },
    "carregar_fonte": {
      "type": "vazio",
      "description": "Carrega uma fonte no ambiente gráfico a partir de um arquivo de fonte presente no sistema de arquivos",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "caminho_fonte",
          "description": "o caminho do arquivo de fonte no sistema de arquivos"
        }
      ]
    },
    "definir_icone_janela": {
      "type": "vazio",
      "description": "Altera o ícone que é exibido na janela do ambiente gráfico. Este ícone aparece ao lado do título da janela e na barra de tarefas do sistema operacional",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço da imagem que será usada como ícone"
        }
      ]
    },
    "definir_opacidade": {
      "type": "vazio",
      "description": "Esta função define o nível de opacidade dos desenhos no ambiente gráfico. Quanto menor for a opacidade, mais transparente será o desenho e quanto maior for a opacidade mais opaco será o desenho. Com esta função, é possível desenhar imagens, textos e primitivas gráficas semi-transparentes, o que permite \"enxergar\" através dos desenhos.É importante notar que, após ser chamada, esta função afeta todos os desenhos realizados. Isto significa que se foram desenhados um retângulo e uma elipse após a chamada desta função, ambos terão seu nível de opacidade alterados.Caso fosse desejável modificar apenas a opacidade do retângulo, então seria necessário chamar novamente esta função definido a opacidade para o valor máximo antes de desenhar a elipse",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "opacidade",
          "description": "o nível de opacidade dos desenhos. O valor deve estar entre 0 e 255, sendo que, 0 indica um desenho totalmente transparente e 255 indica um desenho totalmente opaco"
        }
      ]
    },
    "definir_rotacao": {
      "type": "vazio",
      "description": "Esta função define o grau de rotação dos desenhos no ambiente gráfico. Com esta função, é possível rotacionar imagens, textos e todas as primitivas gráficas, incluindo linhas, retângulos e elipses.A rotação é realizada sempre a partir do centro do desenho.É importante notar que, após ser chamada, esta função afeta todos os desenhos realizados. Isto significa que se foram desenhados um retângulo e uma elipse após a chamada desta função, ambos serão rotacionados no mesmo grau de inclinação.Caso fosse desejável rotacionar apenas o retângulo, então seria necessário chamar novamente esta função definido a rotação para 0 antes de desenhar a elipse",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "rotacao",
          "description": "o grau de rotação dos desenhos. Pode ser qualquer valor real, incluindo 0, positivos e negativos. Os valores múltiplos de 360.0 e o valor 0.0 indicam que não haverá rotação. Valores positivos, indicam uma rotação no sentido horário enquanto que valores negativos indicam uma rotação no sentido anti-horário"
        }
      ]
    },
    "largura_janela": {
      "type": "inteiro",
      "description": "obtém a largura atual da janela do ambiente gráfico",
      "returns": "",
      "available": true,
      "parameters": []
    },
    "altura_janela": {
      "type": "inteiro",
      "description": "obtém a altura atual da janela do ambiente gráfico",
      "returns": "",
      "available": true,
      "parameters": []
    },
    "largura_tela": {
      "type": "inteiro",
      "description": "obtém a largura da tela do computador",
      "returns": "",
      "available": true,
      "parameters": []
    },
    "altura_tela": {
      "type": "inteiro",
      "description": "obtém a altura da tela do computador",
      "returns": "",
      "available": true,
      "parameters": []
    },
    "entrar_modo_tela_cheia": {
      "type": "vazio",
      "description": "Faz com que a janela gráfica seja redimensionada para ocupar o tamanho total da tela",
      "returns": "",
      "available": true,
      "parameters": []
    },
    "sair_modo_tela_cheia": {
      "type": "vazio",
      "description": "Faz com que a janela gráfica seja redimensionada para o tamanho que possuía antes de entrar no modo de tela cheia",
      "returns": "",
      "available": true,
      "parameters": []
    }
  },
  "Matematica": {
    "potencia": {
      "type": "real",
      "description": "Realiza uma exponenciação através da multiplicação da base por ela mesma tantas vezes quanto indicar o expoente",
      "returns": "A exponenciação da base pelo expoente",
      "available": true,
      "parameters": [
        {
          "type": "real",
          "dimensions": 0,
          "name": "base",
          "description": "o número que será multiplicado"
        },
        {
          "type": "real",
          "dimensions": 0,
          "name": "expoente",
          "description": "o número de vezes que a base será multiplicada"
        }
      ]
    },
    "raiz": {
      "type": "real",
      "description": "Realiza a radiciação (extrai a raíz) de um número por um determinado índice",
      "returns": "a raíz do número informado",
      "available": true,
      "parameters": [
        {
          "type": "real",
          "dimensions": 0,
          "name": "radicando",
          "description": "o número do qual será extraída a raíz"
        },
        {
          "type": "real",
          "dimensions": 0,
          "name": "indice",
          "description": "indica o grau da radiciação. Quando o indice é 2 a raíz é quadrada, quando o indice é 3 a raíz é cúbica, e assim por diante"
        }
      ]
    },
    "arredondar": {
      "type": "real",
      "description": "Arredonda um número real para o número de casas decimais informadas. Quando o último dígito for maior ou igual a 5, o número será arredondado para cima, quando o último dígito for menor que 5, o número será arredondado para baixo",
      "returns": "o número arredondado",
      "available": true,
      "parameters": [
        {
          "type": "real",
          "dimensions": 0,
          "name": "numero",
          "description": "o número que será arredondado"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "casas",
          "description": "o número de casas decimais após o arredondamento"
        }
      ]
    },
    "logaritmo": {
      "type": "real",
      "description": "Calcula o logaritmo de um número para uma determinada base",
      "returns": "o logaritmo",
      "available": true,
      "parameters": [
        {
          "type": "real",
          "dimensions": 0,
          "name": "numero",
          "description": "o número resultante da exponenciação"
        },
        {
          "type": "real",
          "dimensions": 0,
          "name": "base",
          "description": "a base da exponenciação"
        }
      ]
    },
    "seno": {
      "type": "real",
      "description": "Calcula o seno do ângulo informado",
      "returns": "o seno do ângulo informado",
      "available": true,
      "parameters": [
        {
          "type": "real",
          "dimensions": 0,
          "name": "angulo",
          "description": "o ângulo para o qual será calculado o seno"
        }
      ]
    },
    "cosseno": {
      "type": "real",
      "description": "Calcula o cosseno do ângulo informado",
      "returns": "o cosseno do ângulo informado",
      "available": true,
      "parameters": [
        {
          "type": "real",
          "dimensions": 0,
          "name": "angulo",
          "description": "o ângulo para o qual será calculado o cosseno"
        }
      ]
    },
    "tangente": {
      "type": "real",
      "description": "Calcula a tangente do ângulo informado",
      "returns": "a tagente do ângulo informado",
      "available": true,
      "parameters": [
        {
          "type": "real",
          "dimensions": 0,
          "name": "angulo",
          "description": "o ângulo para o qual será calculada a tangente"
        }
      ]
    },
    "valor_absoluto": {
      "type": "real",
      "description": "Calcula o valor absoluto do número informado",
      "returns": "o valor absoluto do número informado",
      "available": true,
      "parameters": [
        {
          "type": "real",
          "dimensions": 0,
          "name": "numero",
          "description": "o número para o qual será calculado o valor absoluto"
        }
      ]
    },
    "maior_numero": {
      "type": "real",
      "description": "Identifica o maior número entre os números informados",
      "returns": "o maior número",
      "available": true,
      "parameters": [
        {
          "type": "real",
          "dimensions": 0,
          "name": "numeroA",
          "description": "um número qualquer"
        },
        {
          "type": "real",
          "dimensions": 0,
          "name": "numeroB",
          "description": "um número qualquer"
        }
      ]
    },
    "menor_numero": {
      "type": "real",
      "description": "Identifica o menor número entre os números informados",
      "returns": "o menor número",
      "available": true,
      "parameters": [
        {
          "type": "real",
          "dimensions": 0,
          "name": "numeroA",
          "description": "um número qualquer"
        },
        {
          "type": "real",
          "dimensions": 0,
          "name": "numeroB",
          "description": "um número qualquer"
        }
      ]
    }
  },
  "Util": {
    "obter_diretorio_usuario": {
      "type": "cadeia",
      "description": "Obtém o caminho utilizado pelo Sistema Operacional como diretório do usuário atual",
      "returns": "O diretório do usuário",
      "available": true,
      "parameters": []
    },
    "numero_elementos": {
      "type": "inteiro",
      "description": "Descobre o número de elementos existentes em um vetor",
      "returns": "O número de elementos existentes no vetor",
      "available": true,
      "parameters": [
        {
          "type": "todos",
          "dimensions": 1,
          "name": "vetor",
          "description": "o vetor em questão"
        }
      ]
    },
    "numero_linhas": {
      "type": "inteiro",
      "description": "Descobre o número de linhas existentes em uma matriz",
      "returns": "O número de linhas existentes na matriz",
      "available": true,
      "parameters": [
        {
          "type": "todos",
          "dimensions": 2,
          "name": "matriz",
          "description": "a matriz em questão"
        }
      ]
    },
    "numero_colunas": {
      "type": "inteiro",
      "description": "Descobre o número de colunas existentes em uma matriz",
      "returns": "O número de colunas existentes na matriz",
      "available": true,
      "parameters": [
        {
          "type": "todos",
          "dimensions": 2,
          "name": "matriz",
          "description": "a matriz em questão"
        }
      ]
    },
    "sorteia": {
      "type": "inteiro",
      "description": "Sorteia um número aleatório entre os valores mínimo e máximo especificados",
      "returns": "O número sorteado",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "minimo",
          "description": "o menor número que pode ser sorteado"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "maximo",
          "description": "o maior número que pode ser sorteado"
        }
      ]
    },
    "aguarde": {
      "type": "vazio",
      "description": "Pausa a execução do programa durante o intervalo de tempo especificado",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "intervalo",
          "description": "o intervalo de tempo (em milissegundos) durante o qual o programa ficará pausado"
        }
      ]
    },
    "tempo_decorrido": {
      "type": "inteiro",
      "description": "Obtém o tempo decorrido (em milissegundos) desde que a biblioteca foi utilizada pela primeira vez",
      "returns": "",
      "available": true,
      "parameters": []
    }
  },
  "Teclado": {
    "tecla_pressionada": {
      "type": "logico",
      "description": "Testa se uma determinada tecla está pressionada neste instante",
      "returns": "o resultado do teste. Verdadeiro se a tecla estiver pressionada no momento do teste. Caso contrário, retorna falso",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "tecla",
          "description": "o código da tecla que será testada"
        }
      ]
    },
    "alguma_tecla_pressionada": {
      "type": "logico",
      "description": "Testa se existe alguma tecla pressionada neste instante",
      "returns": "o resultado do teste. Verdadeiro se houver uma tecla pressionada no momento do teste. Caso contrário, retorna falso",
      "available": true,
      "parameters": []
    },
    "ler_tecla": {
      "type": "inteiro",
      "description": "Aguarda até que uma tecla seja digitada, isto é, foi pressionada e depois solta, e captura o seu código",
      "returns": "o código da tecla lida",
      "available": true,
      "parameters": []
    },
    "caracter_tecla": {
      "type": "caracter",
      "description": "Obtém o caracter correspondente a uma determinada tecla",
      "returns": "o caracter correspondente à tecla",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "tecla",
          "description": "a tecla para a qual se quer obter o caracter"
        }
      ]
    },
    "inicializar": {
      "type": "vazio",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": [
        {
          "type": "vazio",
          "dimensions": 0,
          "name": "parametro1",
          "description": ""
        },
        {
          "type": "vazio",
          "dimensions": 0,
          "name": "parametro2",
          "description": ""
        }
      ]
    }
  },
  "Mouse": {
    "botao_pressionado": {
      "type": "logico",
      "description": "Testa se um determinado botão do mouse está pressionado neste instante",
      "returns": "o resultado do teste. Verdadeiro se o botão estiver pressionado no momento do teste. Caso contrário, retorna falso",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "botao",
          "description": "o código do botão que será testado"
        }
      ]
    },
    "algum_botao_pressionado": {
      "type": "logico",
      "description": "Testa se existe algum botão do mouse pressionado neste instante",
      "returns": "o resultado do teste. Verdadeiro se houver um botão do mouse pressionado no momento do teste. Caso contrário, retorna falso",
      "available": true,
      "parameters": []
    },
    "ler_botao": {
      "type": "inteiro",
      "description": "Aguarda até que um botão seja clicado (isto é, foi pressionado e depois solto), e captura o seu código",
      "returns": "o código do botão lido",
      "available": true,
      "parameters": []
    },
    "posicao_x": {
      "type": "inteiro",
      "description": "Obtém a coordenada X do mouse neste instante",
      "returns": "a coordenada X do mouse neste instante",
      "available": true,
      "parameters": []
    },
    "posicao_y": {
      "type": "inteiro",
      "description": "Obtém a coordenada Y do mouse neste instante",
      "returns": "a coordenada Y do mouse neste instante",
      "available": true,
      "parameters": []
    },
    "ocultar_cursor": {
      "type": "vazio",
      "description": "Oculta o cursor do mouse",
      "returns": "",
      "available": true,
      "parameters": []
    },
    "exibir_cursor": {
      "type": "vazio",
      "description": "Exibe novamente o cursor do mouse caso ele esteja oculto",
      "returns": "",
      "available": true,
      "parameters": []
    },
    "inicializar": {
      "type": "vazio",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": [
        {
          "type": "vazio",
          "dimensions": 0,
          "name": "parametro1",
          "description": ""
        },
        {
          "type": "vazio",
          "dimensions": 0,
          "name": "parametro2",
          "description": ""
        }
      ]
    }
  },
  "Tipos": {
    "cadeia_e_inteiro": {
      "type": "logico",
      "description": "Verifica se a cadeia passada por parâmetro representa um valor do tipo inteiro escrito na notação definida pelo parâmetro base",
      "returns": "verdadeiro se a cadeia representar um valor do tipo inteiro, caso contrário, retorna falso",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "cad",
          "description": "a cadeia a ser verificada"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "base",
          "description": "a base que deverá ser assumida ao realizar a verificação. Os valores possíveis são: 2, 10 e 16.\n\nO valor 2 assume que a cadeia representa um número inteiro escrito em notação binária.\nEx.: 0b1001; 01101001; 101; 0B1101.\n\nO valor 10 assume que a cadeia representa um número inteiro escrito em notação decimal.\nEx.: 52; -34; 0; 71.\n\nO valor 16 assume que a cadeia representa um número inteiro escrito em notação hexadecimal.\nEx.: 0xFF5AC; 0XDf5Ac01B; A0B551ce; ff00ff.\n\nCaso a base informada seja diferente de qualquer um destes valores, será gerado um erro de execução."
        }
      ]
    },
    "cadeia_e_real": {
      "type": "logico",
      "description": "Verifica se a cadeia passada por parâmetro representa um valor do tipo real",
      "returns": "verdadeiro se a cadeia representar um valor do tipo real, caso contrário, retorna falso",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "cad",
          "description": "a cadeia a ser verificada"
        }
      ]
    },
    "cadeia_e_logico": {
      "type": "logico",
      "description": "Verifica se a cadeia passada por parâmetro representa um valor do tipo logico",
      "returns": "verdadeiro se a cadeia representar um valor do tipo logico, caso contrário, retorna falso",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "cad",
          "description": "a cadeia a ser verificada"
        }
      ]
    },
    "cadeia_e_caracter": {
      "type": "logico",
      "description": "Verifica se a cadeia passada por parâmetro representa um valor do tipo caracter",
      "returns": "verdadeiro se a cadeia representar um valor do tipo caracter, caso contrário, retorna falso",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "cad",
          "description": "a cadeia a ser verificada"
        }
      ]
    },
    "cadeia_para_caracter": {
      "type": "caracter",
      "description": "Converte um valor do tipo cadeia em um valor do tipo caracter",
      "returns": "um valor do tipo caracter",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "valor",
          "description": "o valor a ser convertido"
        }
      ]
    },
    "cadeia_para_inteiro": {
      "type": "inteiro",
      "description": "Converte um valor do tipo cadeia em um valor do tipo inteiro utilizando a base informada",
      "returns": "um valor do tipo inteiro",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "valor",
          "description": "o valor a ser convertido"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "base",
          "description": "a notação em que o número inteiro está representado na cadeia. Os valores possíveis são: 2, 10 e 16.\n\nO valor 2 assume que a cadeia representa um número inteiro escrito em notação binária.\nEx.: 0b1001; 01101001; 101; 0B1101.\n\nO valor 10 assume que a cadeia representa um número inteiro escrito em notação decimal.\nEx.: 52; -34; 0; 71.\n\nO valor 16 assume que a cadeia representa um número inteiro escrito em notação hexadecimal.\nEx.: 0xFF5AC; 0XDf5Ac01B; A0B551ce; ff00ff.\n\nCaso a base informada seja diferente de qualquer um destes valores, será gerado um erro de execução."
        }
      ]
    },
    "cadeia_para_real": {
      "type": "real",
      "description": "Converte um valor do tipo cadeia em um valor do tipo real",
      "returns": "um valor do tipo real",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "valor",
          "description": "o valor a ser convertido"
        }
      ]
    },
    "cadeia_para_logico": {
      "type": "logico",
      "description": "Converte um valor do tipo cadeia em um valor do tipo logico",
      "returns": "um valor do tipo logico",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "valor",
          "description": "o valor a ser convertido"
        }
      ]
    },
    "inteiro_e_caracter": {
      "type": "logico",
      "description": "Verifica se o inteiro passado por parâmetro representa um valor do tipo caracter",
      "returns": "verdadeiro se o inteiro representar um valor do tipo caracter, caso contrário, retorna falso",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "int",
          "description": "o inteiro a a ser verificado"
        }
      ]
    },
    "inteiro_para_cadeia": {
      "type": "cadeia",
      "description": "Converte um valor do tipo inteiro em um valor do tipo cadeia utilizando a base informada",
      "returns": "um valor do tipo cadeia",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "valor",
          "description": "o valor a ser convertido"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "base",
          "description": "a notação em que o número inteiro está representado na cadeia. Os valores possíveis são: 2, 10 e 16.\n\nO valor 2 assume que a cadeia representa um número inteiro escrito em notação binária.\nEx.: 0b1001; 01101001; 101; 0B1101.\n\nO valor 10 assume que a cadeia representa um número inteiro escrito em notação decimal.\nEx.: 52; -34; 0; 71.\n\nO valor 16 assume que a cadeia representa um número inteiro escrito em notação hexadecimal.\nEx.: 0xFF5AC; 0XDf5Ac01B; A0B551ce; ff00ff.\n\nCaso a base informada seja diferente de qualquer um destes valores, será gerado um erro de execução."
        }
      ]
    },
    "inteiro_para_caracter": {
      "type": "caracter",
      "description": "Converte um valor do tipo inteiro em um valor do tipo caracter",
      "returns": "um valor do tipo caracter",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "valor",
          "description": "o valor a ser convertido"
        }
      ]
    },
    "inteiro_para_logico": {
      "type": "logico",
      "description": "Converte um valor do tipo inteiro em um valor do tipo logico",
      "returns": "falso se o valor for menor ou igual a 0, verdadeiro se o valor for maior ou igual a 1",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "valor",
          "description": "o valor a ser convertido"
        }
      ]
    },
    "inteiro_para_real": {
      "type": "real",
      "description": "Converte um valor do tipo inteiro em um valor do tipo real",
      "returns": "um valor do tipo real",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "valor",
          "description": "o valor a ser convertido"
        }
      ]
    },
    "caracter_e_inteiro": {
      "type": "logico",
      "description": "Verifica se o caracter passado por parâmetro representa um valor do tipo inteiro",
      "returns": "verdadeiro se o caracter representar um valor do tipo inteiro, caso contrário, retorna falso",
      "available": true,
      "parameters": [
        {
          "type": "caracter",
          "dimensions": 0,
          "name": "car",
          "description": "o caracter a ser verificado"
        }
      ]
    },
    "caracter_e_logico": {
      "type": "logico",
      "description": "Verifica se o caracter passado por parâmetro representa um valor do tipo logico",
      "returns": "verdadeiro se o caracter for um dos seguintes valores: 'S', 's', 'N' ou 'n'. Caso contrário, retorna falso",
      "available": true,
      "parameters": [
        {
          "type": "caracter",
          "dimensions": 0,
          "name": "car",
          "description": "o caracter a ser verificado"
        }
      ]
    },
    "caracter_para_cadeia": {
      "type": "cadeia",
      "description": "Converte um valor do tipo caracter em um valor do tipo cadeia",
      "returns": "um valor do tipo cadeia",
      "available": true,
      "parameters": [
        {
          "type": "caracter",
          "dimensions": 0,
          "name": "valor",
          "description": "o valor a ser convertido"
        }
      ]
    },
    "caracter_para_inteiro": {
      "type": "inteiro",
      "description": "Converte um valor do tipo caracter em um valor do tipo inteiro",
      "returns": "um valor do tipo caracter",
      "available": true,
      "parameters": [
        {
          "type": "caracter",
          "dimensions": 0,
          "name": "valor",
          "description": "o valor a ser convertido"
        }
      ]
    },
    "caracter_para_logico": {
      "type": "logico",
      "description": "Converte um valor do tipo caracter em um valor do tipo logico",
      "returns": "verdadeiro se o caracter for um dos seguintes valores: 'S', 's'; falso se o caracter for um dos seguintes valores: 'N', 'n'",
      "available": true,
      "parameters": [
        {
          "type": "caracter",
          "dimensions": 0,
          "name": "valor",
          "description": "o valor a ser convertido"
        }
      ]
    },
    "logico_para_cadeia": {
      "type": "cadeia",
      "description": "Converte um valor do tipo logico em um valor do tipo cadeia",
      "returns": "um valor do tipo cadeia",
      "available": true,
      "parameters": [
        {
          "type": "logico",
          "dimensions": 0,
          "name": "valor",
          "description": "o valor a ser convertido"
        }
      ]
    },
    "logico_para_inteiro": {
      "type": "inteiro",
      "description": "Converte um valor do tipo logico em um valor do tipo inteiro",
      "returns": "1 se o valor passado por parâmetro for verdadeiro, 0 se o valor passado por parâmetro for falso",
      "available": true,
      "parameters": [
        {
          "type": "logico",
          "dimensions": 0,
          "name": "valor",
          "description": "o valor a ser convertido"
        }
      ]
    },
    "logico_para_caracter": {
      "type": "caracter",
      "description": "Converte um valor do tipo logico em um valor do tipo caracter",
      "returns": "'S' se o valor passado por parâmetro for verdadeiro, 'N' se o valor passado por parâmetro for falso",
      "available": false,
      "parameters": [
        {
          "type": "logico",
          "dimensions": 0,
          "name": "valor",
          "description": "o valor a ser convertido"
        }
      ]
    },
    "real_para_cadeia": {
      "type": "cadeia",
      "description": "Converte um valor do tipo real em um valor do tipo cadeia",
      "returns": "um valor do tipo cadeia",
      "available": true,
      "parameters": [
        {
          "type": "real",
          "dimensions": 0,
          "name": "valor",
          "description": "o valor a ser convertido"
        }
      ]
    },
    "real_para_inteiro": {
      "type": "inteiro",
      "description": "Converte um valor do tipo real em um valor do tipo inteiro. Se o valor real tiver uma porção fracionária (Ex.: 9.56), o valor será truncado (Ex.: 9)",
      "returns": "um valor do tipo inteiro",
      "available": true,
      "parameters": [
        {
          "type": "real",
          "dimensions": 0,
          "name": "valor",
          "description": "o valor a ser convertido"
        }
      ]
    }
  },
  "Calendario": {
    "dia_mes_atual": {
      "type": "inteiro",
      "description": "Recupera o dia no mês atual do computador.",
      "returns": "um inteiro com o dia no mês com dois digitos, se forem menores que 10 apenas com um digito. Ex: 26.",
      "available": true,
      "parameters": []
    },
    "dia_semana_atual": {
      "type": "inteiro",
      "description": "Recupera o dia da semana de 1 a 7.",
      "returns": "um inteiro com o dia da semana. Ex: 1, para Domingo.",
      "available": true,
      "parameters": []
    },
    "mes_atual": {
      "type": "inteiro",
      "description": "Recupera o mês atual do computador de 1 a 12.",
      "returns": "um inteiro com o mês com dois digitos, se forem menores que 10 apenas com um digito. Ex: 10.",
      "available": true,
      "parameters": []
    },
    "ano_atual": {
      "type": "inteiro",
      "description": "Recupera o ano atual do computador.",
      "returns": "um inteiro com o ano. Ex: 2012.",
      "available": true,
      "parameters": []
    },
    "hora_atual": {
      "type": "inteiro",
      "description": "Recupera os digitos da hora atual do computador.",
      "returns": "um inteiro com a hora atual no formato 12h ou 24h com dois digitos, se forem menores que 10 apenas com um digito. Ex: 22 para 24h, se o parâmetro for falso ou 10 para 12h, se o parâmetro for verdadeiro.",
      "available": true,
      "parameters": [
        {
          "type": "logico",
          "dimensions": 0,
          "name": "formato_12h",
          "description": "um logico que se verdadeiro o retorno será no formato 12h se falso será em 24h"
        }
      ]
    },
    "minuto_atual": {
      "type": "inteiro",
      "description": "Recupera os digitos do minuto atual do computador.",
      "returns": "um inteiro com os minutos atuais com dois digitos, se forem menores que 10 apenas com um digito. Ex: 45.",
      "available": true,
      "parameters": []
    },
    "segundo_atual": {
      "type": "inteiro",
      "description": "Recupera os digitos dos segundos atuais do computador.",
      "returns": "um inteiro com os segundos atuais com dois digitos, se forem menores que 10 apenas com um digito. Ex: 32.",
      "available": true,
      "parameters": []
    },
    "milisegundo_atual": {
      "type": "inteiro",
      "description": "Recupera os digitos dos milisegundos atuais do computador.",
      "returns": "um inteiro com os milisegundos atuais, com um, dois ou três digitos. Ex: 426.",
      "available": true,
      "parameters": []
    },
    "dia_semana_completo": {
      "type": "cadeia",
      "description": "De acordo com o valor de 1 a 7 informado retornará um dia da semana completo.",
      "returns": "uma cadeia com o dia da semana completo. Ex: Segunda-Feira.",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "numero_dia",
          "description": "um inteiro referente a um dia da semana"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "caixa_alta",
          "description": "logico para retorno em em caracteres maiúsculos"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "caixa_baixa",
          "description": "logico para retorno em em caracteres minúsculos"
        }
      ]
    },
    "dia_semana_curto": {
      "type": "cadeia",
      "description": "De acordo com o valor de 1 a 7 informado retornará um dia da semana de forma curta.",
      "returns": "uma cadeia com o dia da semana de forma curta. Ex: Segunda, para Segunda-Feira.",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "numero_dia",
          "description": "um inteiro referente a um dia da semana"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "caixa_alta",
          "description": "logico para retorno em em caracteres maiúsculos"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "caixa_baixa",
          "description": "logico para retorno em em caracteres minúsculos"
        }
      ]
    },
    "dia_semana_abreviado": {
      "type": "cadeia",
      "description": "De acordo com o valor de 1 a 7 informado retornará um dia da semana abreviado.",
      "returns": "uma cadeia com o dia da semana abreviado. Ex: Seg, para Segunda-Feira.",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "numero_dia",
          "description": "um inteiro referente a um dia da semana"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "caixa_alta",
          "description": "logico para retorno em em caracteres maiúsculos"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "caixa_baixa",
          "description": "logico para retorno em em caracteres minúsculos"
        }
      ]
    }
  },
  "Texto": {
    "numero_caracteres": {
      "type": "inteiro",
      "description": "Conta o número de caracteres existentes em uma cadeia",
      "returns": "o número de caracteres na cadeia",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "cadeia",
          "description": "um valor qualquer do tipo cadeia"
        }
      ]
    },
    "caixa_alta": {
      "type": "cadeia",
      "description": "Transforma os caracteres de uma cadeia em caracteres maiúsculos",
      "returns": "a cadeia com os caracteres transformados",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "cad",
          "description": "um valor qualquer do tipo cadeia"
        }
      ]
    },
    "caixa_baixa": {
      "type": "cadeia",
      "description": "Transforma os caracteres de uma cadeia em caracteres minúsculos",
      "returns": "a cadeia com os caracteres transformados",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "cad",
          "description": "um valor qualquer do tipo cadeia"
        }
      ]
    },
    "substituir": {
      "type": "cadeia",
      "description": "Pesquisa por um determinado texto em uma cadeia e substitui todas as ocorrências por um texto alternativo",
      "returns": "a cadeia resultante da substituição",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "cad",
          "description": "a cadeia que será pesquisada"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "texto_pesquisa",
          "description": "o texto que será pesquisado na cadeia"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "texto_substituto",
          "description": "o texto pelo qual as ocorrências serão substituídas"
        }
      ]
    },
    "preencher_a_esquerda": {
      "type": "cadeia",
      "description": "Concatena o caracter informado, à esquerda da cadeia, até que a cadeia fique do tamanho indicado.\n\nSe o tamanho da cadeia for maior ou igual ao tamanho informado, nada é feito",
      "returns": "a cadeia transformada",
      "available": true,
      "parameters": [
        {
          "type": "caracter",
          "dimensions": 0,
          "name": "car",
          "description": "o caracter que será concatenado á esquerda da cadeia"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "tamanho",
          "description": "o tamanho final da cadeia"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "cad",
          "description": "a cadeia que será transformada"
        }
      ]
    },
    "obter_caracter": {
      "type": "caracter",
      "description": "Obtém um caracter da cadeia a partir de seu índice.\n\nO índice deve estar entre 0 e o número de caracteres da cadeia",
      "returns": "o caracater no índice informado",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "cad",
          "description": "a cadeia da qual será obtido o caracater"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "indice",
          "description": "o indice do caracter que se deseja obter"
        }
      ]
    },
    "posicao_texto": {
      "type": "inteiro",
      "description": "Procura por um texto dentro de uma cadeia e, caso encontrado, retorna a posição da primeira ocorrência",
      "returns": "a posição da primeira ocorrência do texto, caso ele seja encontrado. Caso o texto não seja encontrado na cadeia o valor retornado é -1",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "texto",
          "description": "o texto que será procurado na cadeia"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "cad",
          "description": "a cadeia dentro da qual o texto será procurado"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "posicao_incial",
          "description": "a posição inicial a partir da qual o texto será procurado. Para procurar a partir do início da cadeia deve-se informar a posição 0"
        }
      ]
    },
    "extrair_subtexto": {
      "type": "cadeia",
      "description": "Extrai uma parte da cadeia delimitada pela posição inicial e final. Exemplos: extrair_subtexto(\"salgado\", 0, 3) // resultado: \"sal\"extrair_subtexto(\"salgado\", 3, 7) // resultado: \"gado\"extrair_subtexto(\"salgado\", 1, 5) // resultado: \"alga\"",
      "returns": "uma cadeia contendo o subtexto",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "cad",
          "description": "a cadeia a partir da qual será extraído o subtexto"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "posicao_inicial",
          "description": "a posição dentro da cadeia onde começará o subtexto"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "posicao_final",
          "description": "a posição dentro da cadeia onde terminará o subtexto"
        }
      ]
    }
  },
  "Arquivos": {
    "abrir_arquivo": {
      "type": "inteiro",
      "description": "Abre um arquivo para leitura ou escrita. No modo leitura, caso o arquivo informado não exista, será gerado um erro. No modo escrita, caso o arquivo informado não exista, ele tentará ser criado, se a criação do arquivo falhar, então será gerado um erro.IMPORTANTE: ao abrir o arquivo no modo de escrita, o conteúdo do arquivo é apagado para que o novo conteúdo seja escrito. Caso seja necessário manter o conteúdo atual do arquivo, deve-se armazená-lo em uma variável e depois escrevê-lo novamente no arquivo.",
      "returns": "o endereço de memória onde o arquivo foi carregado",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "caminho_arquivo",
          "description": "o nome do arquivo que se quer abrir"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "modo_acesso",
          "description": "determina se o arquivo será aberto para leitura ou para escrita.Constantes aceitas: MODO_LEITURA | MODO_ESCRITA | MODO_ACRESCENTAR"
        }
      ]
    },
    "fechar_arquivo": {
      "type": "vazio",
      "description": "Fecha um arquivo aberto anteriormente",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória do arquivo"
        }
      ]
    },
    "fim_arquivo": {
      "type": "logico",
      "description": "Verifica se o arquivo chegou ao fim, isto é, se todas as linhas já foram lidas. Esta função só é executada se o arquivo estiver aberto em modo de leitura. Se o arquivo estiver em modo de escrita, será gerado um erro.",
      "returns": "verdadeiro se o arquivo tiver chegado ao fim. Caso contrário retorna falso",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória do arquivo"
        }
      ]
    },
    "ler_linha": {
      "type": "cadeia",
      "description": "Lê a próxima linha do arquivo. Esta função só é executada se o arquivo estiver aberto em modo de leitura. Se o arquivo estiver em modo de escrita, será gerado um erro.",
      "returns": "Uma cadeia contendo o conteudo da linha lida.",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória do arquivo"
        }
      ]
    },
    "escrever_linha": {
      "type": "vazio",
      "description": "Escreve uma linha no arquivo. Esta função só é executada se o arquivo estiver aberto em modo de escrita. Se o arquivo estiver em modo de leitura, será gerado um erro.",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "linha",
          "description": "a linha a ser escrita no arquivo"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória do arquivo"
        }
      ]
    },
    "substituir_texto": {
      "type": "vazio",
      "description": "Pesquisa por um determinado texto no arquivo e substitui todas as ocorrências por um texto alternativo",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço do arquivo"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "texto_pesquisa",
          "description": "o texto que será pesquisado no arquivo"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "texto_substituto",
          "description": "o texto pelo qual as ocorrências serão substituídas"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "primeira_ocorrencia",
          "description": "confirma se substituirá apenas a primeira ocorrência no texto, caso contrário, substituirá todas"
        }
      ]
    },
    "arquivo_existe": {
      "type": "logico",
      "description": "Verifica se um determinado arquivo existe no sistema de arquivos",
      "returns": "verdadeiro se o arquivo existir",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "caminho_arquivo",
          "description": "o caminho do arquivo que se quer verificar"
        }
      ]
    },
    "apagar_arquivo": {
      "type": "vazio",
      "description": "Remove um arquivo do sistema de arquivos",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "caminho_arquivo",
          "description": "o caminho do arquivo que ser quer apagar"
        }
      ]
    },
    "inicializar": {
      "type": "vazio",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": [
        {
          "type": "vazio",
          "dimensions": 0,
          "name": "parametro1",
          "description": ""
        },
        {
          "type": "vazio",
          "dimensions": 0,
          "name": "parametro2",
          "description": ""
        }
      ]
    },
    "finalizar": {
      "type": "vazio",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": []
    },
    "selecionar_arquivo": {
      "type": "cadeia",
      "description": "Abre um janela que permite ao usuário navegar nos diretórios do computador e selecionar um arquivo",
      "returns": "O arquivo_selecionado ou uma string vazia caso o usuário tenha cancelado.",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 1,
          "name": "formatos_suportados",
          "description": "Define os formatos de arquivos que poderão ser selecionados. Um formato de arquivo é formado por uma descrição e uma lista de extensões válidas. A descrição deve estar separada da lista de extensões pelo caracter '|' e cada extensão deverá estar separada da outra pelo caracter ','. Ex.: 'Arquivos de texto|txt', 'Arquivos de imagem|png,jpg,jpeg,bmp'"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "aceitar_todos_arquivos",
          "description": "Quando verdadeiro, inclui automaticamente um formato que permite selecionar qualquer arquivo. Este formato também será incluído se nenhum outro formato for informado no parâmetro 'formatos_suportados'"
        }
      ]
    },
    "run": {
      "type": "vazio",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": []
    },
    "listar_pastas": {
      "type": "vazio",
      "description": "Altera um vetor para que ele represente as pastas existentes em um diretório",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "caminho_pai",
          "description": "Define o diretório cujas pastas serão listadas"
        },
        {
          "type": "cadeia",
          "dimensions": 1,
          "name": "vetor_pastas",
          "description": "Vetor destino que contará com as pastas encontradas"
        }
      ]
    },
    "listar_arquivos": {
      "type": "vazio",
      "description": "Altera um vetor para que ele represente os arquivos existentes em um diretório",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "caminho_pai",
          "description": "Define o diretório cujas pastas serão listadas"
        },
        {
          "type": "cadeia",
          "dimensions": 1,
          "name": "vetor_arquivos",
          "description": "Vetor destino que contará com as pastas encontradas"
        }
      ]
    },
    "listar_arquivos_por_tipo": {
      "type": "vazio",
      "description": "Altera um vetor para que ele represente os arquivos existentes em um diretório",
      "returns": "",
      "available": false,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "caminho_pai",
          "description": "Define o diretório cujas pastas serão listadas"
        },
        {
          "type": "cadeia",
          "dimensions": 1,
          "name": "vetor_arquivos",
          "description": "Vetor destino que contará com as pastas encontradas"
        },
        {
          "type": "cadeia",
          "dimensions": 1,
          "name": "vetor_tipos",
          "description": "Vetor destino que contará com as pastas encontradas"
        }
      ]
    },
    "accept": {
      "type": "logico",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": [
        {
          "type": "vazio",
          "dimensions": 0,
          "name": "parametro1",
          "description": ""
        }
      ]
    },
    "criar_pasta": {
      "type": "vazio",
      "description": "Cria pastas no caminho informado caso elas não existam",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "caminho",
          "description": "Caminho onde as pastas serão criadas"
        }
      ]
    },
    "abrir": {
      "type": "vazio",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": [
        {
          "type": "vazio",
          "dimensions": 0,
          "name": "parametro1",
          "description": ""
        }
      ]
    },
    "ler": {
      "type": "cadeia",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": []
    },
    "escrever": {
      "type": "vazio",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "linha",
          "description": ""
        }
      ]
    },
    "fim": {
      "type": "logico",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": []
    },
    "fechar": {
      "type": "vazio",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": []
    }
  },
  "Sons": {
    "carregar_som": {
      "type": "inteiro",
      "description": "Carrega um som na memória para ser reproduzido mais tarde",
      "returns": "o endereço de memória no qual o som foi carregado",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "caminho_som",
          "description": "o caminho para o arquivo de som no sistema de arquivos"
        }
      ]
    },
    "liberar_som": {
      "type": "vazio",
      "description": "Libera a memória utilizada por um som que tenha sido previamente carregado. Se o som estiver sendo reproduzido, todas as reproduções deste som serão interrompidas",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória do som"
        }
      ]
    },
    "reproduzir_som": {
      "type": "inteiro",
      "description": "Reproduz um som previamente carregado na memória. O som é reproduzido de forma assíncrona, ou seja, o som ficará reproduzindo no fundo, enquanto o programa executa as próximas instruções normalmente. Um mesmo som pode ser reproduzido várias vezes e pode se sobrepor a outros sons.",
      "returns": "o endereço de memória da reprodução de som. Este endereço é utilizado quando se deseja interromper esta reprodução de som especificamente.",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória do som a ser reproduzido"
        },
        {
          "type": "logico",
          "dimensions": 0,
          "name": "repetir",
          "description": "determina se o som deve ficar repetindo até ser manualmente interrompido"
        }
      ]
    },
    "pausar_som": {
      "type": "vazio",
      "description": "Pausa uma reprodução específica de um som que está sendo executada no momento",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória da reprodução que se quer interromper"
        }
      ]
    },
    "interromper_som": {
      "type": "vazio",
      "description": "Interrompe uma reprodução específica de um som que está sendo executada no momento",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória da reprodução que se quer interromper"
        }
      ]
    },
    "obter_tamanho_musica": {
      "type": "inteiro",
      "description": "Obtêm o tamanho da música em milisegundos",
      "returns": "tempo total em milissegundos do som",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória da reprodução que se quer alterar o volume"
        }
      ]
    },
    "obter_posicao_atual_musica": {
      "type": "inteiro",
      "description": "Obtêm a posição atual da música em milisegundos",
      "returns": "o tempo atual em milissegundos do som",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória da reprodução que se quer alterar o volume"
        }
      ]
    },
    "definir_posicao_atual_musica": {
      "type": "vazio",
      "description": "Define a posição atual da música em milisegundos",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória da reprodução que se quer alterar o volume"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "milissegundos",
          "description": "o tempo em milissegundos que deseja colocar a musica"
        }
      ]
    },
    "definir_volume_reproducao": {
      "type": "vazio",
      "description": "Define um novo volume para um som que já está sendo executado",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "o endereço de memória da reprodução que se quer alterar o volume"
        },
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "volume",
          "description": "o novo volume entre 0 e 100"
        }
      ]
    },
    "definir_volume": {
      "type": "vazio",
      "description": "Define o volume geral",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "volume",
          "description": "O novo volume geral (entre 0 e 100)"
        }
      ]
    },
    "obter_volume": {
      "type": "inteiro",
      "description": "Retorna o volume geral",
      "returns": "Um valor do tipo inteiro entre 0 e 100 representando o volume geral atual.",
      "available": true,
      "parameters": []
    },
    "obter_volume_reproducao": {
      "type": "inteiro",
      "description": "Retornar o volume de uma reprodução de som",
      "returns": "Um valor do tipo inteiro entre 0 e 100 representando o volume atual da reprodução. Caso a reprodução não exista ou já tenha sido finalizada o valor -1 será retornado",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "endereco",
          "description": "O endereço de memória da reprodução que se quer obter o volume"
        }
      ]
    },
    "inicializar": {
      "type": "vazio",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": [
        {
          "type": "vazio",
          "dimensions": 0,
          "name": "parametro1",
          "description": ""
        },
        {
          "type": "vazio",
          "dimensions": 0,
          "name": "parametro2",
          "description": ""
        }
      ]
    },
    "finalizar": {
      "type": "vazio",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": []
    },
    "inicia": {
      "type": "vazio",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": [
        {
          "type": "logico",
          "dimensions": 0,
          "name": "repetir",
          "description": ""
        }
      ]
    },
    "pausa": {
      "type": "vazio",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": [
        {
          "type": "logico",
          "dimensions": 0,
          "name": "fechaClip",
          "description": ""
        }
      ]
    },
    "interrompe": {
      "type": "vazio",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": [
        {
          "type": "logico",
          "dimensions": 0,
          "name": "fechaClip",
          "description": ""
        }
      ]
    }
  },
  "Internet": {
    "inicializar": {
      "type": "vazio",
      "description": "",
      "returns": "",
      "available": false,
      "parameters": [
        {
          "type": "vazio",
          "dimensions": 0,
          "name": "parametro1",
          "description": ""
        },
        {
          "type": "vazio",
          "dimensions": 0,
          "name": "parametro2",
          "description": ""
        }
      ]
    },
    "definir_tempo_limite": {
      "type": "vazio",
      "description": "Define um valor de tempo limite de espera",
      "returns": "",
      "available": true,
      "parameters": [
        {
          "type": "inteiro",
          "dimensions": 0,
          "name": "tempo",
          "description": "o tempo limite de espera"
        }
      ]
    },
    "obter_texto": {
      "type": "cadeia",
      "description": "Obtém o conteúdo de um página web",
      "returns": "O conteúdo de uma pagina web",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "caminho",
          "description": "o caminho de onde o conteúdo deverá ser obtido"
        }
      ]
    },
    "baixar_imagem": {
      "type": "cadeia",
      "description": "Obtém recursos de um página web",
      "returns": "O tipo da Imagem",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "endereço",
          "description": "o endereço de onde o conteúdo deverá ser obtido"
        },
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "caminho",
          "description": "o caminho de onde o conteúdo deverá ser salvo"
        }
      ]
    },
    "endereco_disponivel": {
      "type": "logico",
      "description": "Verifica a disponibilidade atual de algum endereço",
      "returns": "verdadeiro se o endereço estiver disponível no momento falso se não",
      "available": true,
      "parameters": [
        {
          "type": "cadeia",
          "dimensions": 0,
          "name": "endereço",
          "description": "o endereço de onde o conteúdo deverá ser obtido"
        }
      ]
    }
  }
};
export const libraryConstants = {
  "Objetos": {
    "TIPO_INTEIRO": {
      "type": "inteiro",
      "description": "Constante para definir o tipo inteiro"
    },
    "TIPO_CADEIA": {
      "type": "inteiro",
      "description": "Constante para definir o tipo cadeia"
    },
    "TIPO_CARACTER": {
      "type": "inteiro",
      "description": "Constante para definir o tipo caracter"
    },
    "TIPO_REAL": {
      "type": "inteiro",
      "description": "Constante para definir o tipo real"
    },
    "TIPO_LOGICO": {
      "type": "inteiro",
      "description": "Constante para definir o tipo logico"
    },
    "TIPO_OBJETO": {
      "type": "inteiro",
      "description": "Constante para definir o tipo objeto"
    },
    "TIPO_VETOR": {
      "type": "inteiro",
      "description": "Constante para definir o tipo vetor"
    }
  },
  "ServicosWeb": {
    "OBTER": {
      "type": "inteiro",
      "description": "Constante para definir o método HTTP GET"
    },
    "PUBLICAR": {
      "type": "inteiro",
      "description": "Constante para definir o método HTTP POST"
    },
    "ATUALIZAR": {
      "type": "inteiro",
      "description": "Constante para definir o método HTTP PUT"
    },
    "EXCLUIR": {
      "type": "inteiro",
      "description": "Constante para definir o método HTTP DELETE"
    }
  },
  "Graficos": {
    "COR_PRETO": {
      "type": "inteiro",
      "description": "constante que representa a cor 'preto'"
    },
    "COR_BRANCO": {
      "type": "inteiro",
      "description": "constante que representa a cor 'branca'"
    },
    "COR_AZUL": {
      "type": "inteiro",
      "description": "constante que representa a cor 'azul'"
    },
    "COR_VERMELHO": {
      "type": "inteiro",
      "description": "constante que representa a cor 'vermelho'"
    },
    "COR_VERDE": {
      "type": "inteiro",
      "description": "constante que representa a cor 'verde'"
    },
    "COR_AMARELO": {
      "type": "inteiro",
      "description": "constante que representa a cor 'amarelo'"
    },
    "GRADIENTE_INFERIOR_DIREITO": {
      "type": "inteiro",
      "description": "constante que representa o gradiente na rotação inferior direito"
    },
    "GRADIENTE_INFERIOR_ESQUERDO": {
      "type": "inteiro",
      "description": "constante que representa o gradiente na rotação inferior direito"
    },
    "GRADIENTE_SUPERIOR_DIREITO": {
      "type": "inteiro",
      "description": "constante que representa o gradiente na rotação inferior direito"
    },
    "GRADIENTE_SUPERIOR_ESQUERDO": {
      "type": "inteiro",
      "description": "constante que representa o gradiente na rotação inferior direito"
    }
  },
  "Matematica": {
    "PI": {
      "type": "real",
      "description": "Constante matemática que representa a relação entre o perímetro de uma circunferência e seu diâmetro, em outras palavras: perimetro/diâmetro"
    }
  },
  "Util": {},
  "Teclado": {
    "TECLA_ENTER": {
      "type": "inteiro",
      "description": "Código numérico da tecla ENTER no teclado"
    },
    "TECLA_BACKSPACE": {
      "type": "inteiro",
      "description": "Código numérico da tecla BACKSPACE no teclado"
    },
    "TECLA_TAB": {
      "type": "inteiro",
      "description": "Código numérico da tecla TAB no teclado"
    },
    "TECLA_SHIFT": {
      "type": "inteiro",
      "description": "Código numérico da tecla SHIFT no teclado"
    },
    "TECLA_CONTROL": {
      "type": "inteiro",
      "description": "Código numérico da tecla CONTROL no teclado"
    },
    "TECLA_ALT": {
      "type": "inteiro",
      "description": "Código numérico da tecla ALT no teclado"
    },
    "TECLA_ESC": {
      "type": "inteiro",
      "description": "Código numérico da tecla ESC no teclado"
    },
    "TECLA_ESPACO": {
      "type": "inteiro",
      "description": "Código numérico da tecla ESPAÇO no teclado"
    },
    "TECLA_PAGE_UP": {
      "type": "inteiro",
      "description": "Código numérico da tecla PAGE UP  no teclado"
    },
    "TECLA_PAGE_DOWN": {
      "type": "inteiro",
      "description": "Código numérico da tecla PAGE DOWN no teclado"
    },
    "TECLA_SETA_ESQUERDA": {
      "type": "inteiro",
      "description": "Código numérico da tecla SETA ESQUERDA no teclado"
    },
    "TECLA_SETA_ACIMA": {
      "type": "inteiro",
      "description": "Código numérico da tecla SETA ACIMA no teclado"
    },
    "TECLA_SETA_DIREITA": {
      "type": "inteiro",
      "description": "Código numérico da tecla SETA DIREITA no teclado"
    },
    "TECLA_SETA_ABAIXO": {
      "type": "inteiro",
      "description": "Código numérico da tecla SETA ABAIXO no teclado"
    },
    "TECLA_MENOS": {
      "type": "inteiro",
      "description": "Código numérico da tecla '-' no teclado"
    },
    "TECLA_0": {
      "type": "inteiro",
      "description": "Código numérico da tecla '0' no teclado"
    },
    "TECLA_1": {
      "type": "inteiro",
      "description": "Código numérico da tecla '1' no teclado"
    },
    "TECLA_2": {
      "type": "inteiro",
      "description": "Código numérico da tecla '2' no teclado"
    },
    "TECLA_3": {
      "type": "inteiro",
      "description": "Código numérico da tecla '3' no teclado"
    },
    "TECLA_4": {
      "type": "inteiro",
      "description": "Código numérico da tecla '4' no teclado"
    },
    "TECLA_5": {
      "type": "inteiro",
      "description": "Código numérico da tecla '5' no teclado"
    },
    "TECLA_6": {
      "type": "inteiro",
      "description": "Código numérico da tecla '6' no teclado"
    },
    "TECLA_7": {
      "type": "inteiro",
      "description": "Código numérico da tecla '7' no teclado"
    },
    "TECLA_8": {
      "type": "inteiro",
      "description": "Código numérico da tecla '8' no teclado"
    },
    "TECLA_9": {
      "type": "inteiro",
      "description": "Código numérico da tecla '9' no teclado"
    },
    "TECLA_IGUAL": {
      "type": "inteiro",
      "description": "Código numérico da tecla '=' no teclado"
    },
    "TECLA_A": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'A' no teclado"
    },
    "TECLA_B": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'B' no teclado"
    },
    "TECLA_C": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'C' no teclado"
    },
    "TECLA_D": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'D' no teclado"
    },
    "TECLA_E": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'E' no teclado"
    },
    "TECLA_F": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'F' no teclado"
    },
    "TECLA_G": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'G' no teclado"
    },
    "TECLA_H": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'H' no teclado"
    },
    "TECLA_I": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'I' no teclado"
    },
    "TECLA_J": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'J' no teclado"
    },
    "TECLA_K": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'K' no teclado"
    },
    "TECLA_L": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'L' no teclado"
    },
    "TECLA_M": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'M' no teclado"
    },
    "TECLA_N": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'N' no teclado"
    },
    "TECLA_O": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'O' no teclado"
    },
    "TECLA_P": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'P' no teclado"
    },
    "TECLA_Q": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'Q' no teclado"
    },
    "TECLA_R": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'R' no teclado"
    },
    "TECLA_S": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'S' no teclado"
    },
    "TECLA_T": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'T' no teclado"
    },
    "TECLA_U": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'U' no teclado"
    },
    "TECLA_V": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'V' no teclado"
    },
    "TECLA_W": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'W' no teclado"
    },
    "TECLA_X": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'X' no teclado"
    },
    "TECLA_Y": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'Y' no teclado"
    },
    "TECLA_Z": {
      "type": "inteiro",
      "description": "Código numérico da tecla 'Z' no teclado"
    },
    "TECLA_ADICAO": {
      "type": "inteiro",
      "description": "Código numérico da tecla '+' no teclado numérico"
    },
    "TECLA_SUBTRACAO": {
      "type": "inteiro",
      "description": "Código numérico da tecla '-' no teclado numérico"
    },
    "TECLA_DELETAR": {
      "type": "inteiro",
      "description": "Código numérico da tecla DELETE no teclado numérico"
    }
  },
  "Mouse": {
    "BOTAO_ESQUERDO": {
      "type": "inteiro",
      "description": "Código numérico do botão esquerdo do mouse"
    },
    "BOTAO_DIREITO": {
      "type": "inteiro",
      "description": "Código numérico do botão direito do mouse"
    },
    "BOTAO_MEIO": {
      "type": "inteiro",
      "description": "Código numérico do botão do meio do mouse"
    }
  },
  "Tipos": {},
  "Calendario": {},
  "Texto": {},
  "Arquivos": {
    "MODO_LEITURA": {
      "type": "inteiro",
      "description": "indica à biblioteca que o arquivo deve ser aberto apenas para leitura"
    },
    "MODO_ESCRITA": {
      "type": "inteiro",
      "description": "indica à biblioteca que o arquivo deve ser aberto apenas para escrita"
    },
    "MODO_ACRESCENTAR": {
      "type": "inteiro",
      "description": "indica à biblioteca que o arquivo deve ser aberto apenas para escrita que acrescenta ao final do arquivo"
    }
  },
  "Sons": {},
  "Internet": {}
};
