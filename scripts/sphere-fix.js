const faceDrawing = `	// A normal da face determina tanto a visibilidade quanto a iluminação.
	funcao poligon3d(inteiro v1, inteiro v2, inteiro v3)
	{
		real ax = vertices[v2*3] - vertices[v1*3]
		real ay = vertices[v2*3+2] - vertices[v1*3+2]
		real az = vertices[v2*3+1] - vertices[v1*3+1]
		real bx = vertices[v3*3] - vertices[v1*3]
		real by = vertices[v3*3+2] - vertices[v1*3+2]
		real bz = vertices[v3*3+1] - vertices[v1*3+1]

		// A troca dos eixos Y e Z inverte a orientação dos triângulos.
		real nx = by*az - bz*ay
		real ny = bz*ax - bx*az
		real nz = bx*ay - by*ax
		real normal_x = nz*senr + nx*cosr
		real normal_z = nz*cosr - nx*senr

		real centro_x = (vertices[v1*3] + vertices[v2*3] + vertices[v3*3]) / 3.0
		real centro_y = (vertices[v1*3+2] + vertices[v2*3+2] + vertices[v3*3+2]) / 3.0
		real centro_z = (vertices[v1*3+1] + vertices[v2*3+1] + vertices[v3*3+1]) / 3.0
		real x_rotacionado = centro_z*senr + centro_x*cosr
		real z_rotacionado = centro_z*cosr - centro_x*senr

		// A câmera está em (0, 0, -150). Faces voltadas para trás não aparecem.
		se (normal_x*(-x_rotacionado) + ny*(-centro_y) + normal_z*(-150.0-z_rotacionado) <= 0.0)
		{
			retorne
		}

		inteiro pontos[3][2]
		_proj(v1)
		pontos[0][0] = scale * projx * ALTURA_TELA + LARGURA_TELA/2
		pontos[0][1] = scale * projy * ALTURA_TELA + ALTURA_TELA/2
		_proj(v2)
		pontos[1][0] = scale * projx * ALTURA_TELA + LARGURA_TELA/2
		pontos[1][1] = scale * projy * ALTURA_TELA + ALTURA_TELA/2
		_proj(v3)
		pontos[2][0] = scale * projx * ALTURA_TELA + LARGURA_TELA/2
		pontos[2][1] = scale * projy * ALTURA_TELA + ALTURA_TELA/2
		g.definir_cor(cor_face(normal_x, ny, normal_z))
		g.desenhar_poligono(pontos, verdadeiro)
		g.desenhar_poligono(pontos, falso)
	}

	funcao inteiro cor_face(real nx, real ny, real nz)
	{
		real comprimento = m.raiz(nx*nx + ny*ny + nz*nz, 2.0)
		se (comprimento == 0.0) { retorne g.criar_cor(46, 46, 46) }

		// Luz fixa acima, à direita da imagem e à frente da esfera.
		real comprimento_luz = m.raiz(0.4*0.4 + 0.65*0.65 + 1.0, 2.0)
		real difusa = m.maior_numero(0.0, (nx*(-0.4) + ny*0.65 - nz) / (comprimento*comprimento_luz))
		// A parcela ambiente evita preto absoluto nas faces sem luz direta.
		inteiro tom = tp.real_para_inteiro(255.0 * (0.18 + 0.82*difusa))
		tom = tp.real_para_inteiro(m.menor_numero(255.0, m.maior_numero(0.0, tp.inteiro_para_real(tom))))
		retorne g.criar_cor(tom, tom, tom)
	}

`;

export function repairSphere(source) {
  if (source.includes('funcao inteiro cor_face(')) return source;
  return source
    .replace('real cosr = 0.0', 'real cosr = 1.0')
    .replace(/poligon3d\(v0,v1,v2,falso\)\s*poligon3d\(v0,v1,v2,verdadeiro\)/, 'poligon3d(v0,v1,v2)')
    .replace(/\tfuncao poligon3d\([\s\S]*?(?=\tfuncao linha3d)/, faceDrawing);
}
