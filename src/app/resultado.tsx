import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { registrarEvento, registrarLead } from '@/api/cliente';
import { Medidor } from '@/components/medidor';
import { irPara } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, Card, Chip } from '@/components/ui';
import { FAIXAS, ROTULO_AREA } from '@/content/perguntas';
import { AVISO_PEDIATRA, AVISO_RESULTADO, RESPONSAVEL_TECNICA, TEXTOS_RESULTADO } from '@/content/resultados';
import { codigoContato, linkWhatsApp } from '@/domain/contato';
import { formatarIdade } from '@/domain/idade';
import { personalizar, type NivelResultado } from '@/domain/triagem';
import { useApp } from '@/state/app';
import { repositorio, type TriagemSalva } from '@/storage/repositorio';
import { cores, fonte } from '@/theme/tokens';

const COR_BARRA: Record<NivelResultado, string> = { esperado: cores.esperado, observar: '#FFB547', avaliar: cores.avaliar };

export default function ResultadoTela() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { criancaAtual } = useApp();
  const [triagem, setTriagem] = useState<TriagemSalva | null>(null);

  useEffect(() => {
    if (id) repositorio.lerTriagem(id).then(setTriagem);
  }, [id]);

  if (!triagem || !criancaAtual) return <Tela>{null}</Tela>;

  const { resultado } = triagem;
  const faixa = FAIXAS.find((f) => f.id === triagem.faixaId);
  const nome = criancaAtual.apelido;
  const vars = { nome, faixa: faixa?.rotulo ?? '', area: resultado.areaFoco ? ROTULO_AREA[resultado.areaFoco].toLowerCase() : '' };
  const textos = TEXTOS_RESULTADO[resultado.nivel];
  const idade = formatarIdade(triagem.idadeMeses);

  function abrirWhatsApp() {
    const codigo = codigoContato(triagem!.id);
    const url = linkWhatsApp(resultado.nivel, idade, codigo);
    registrarEvento({ tipo: 'whatsapp_aberto', origem: 'resultado' });
    registrarLead(codigo, 'resultado', triagem!.faixaId);
    Linking.openURL(url).catch((e) => console.error('[resultado] não abriu o WhatsApp', e));
  }

  return (
    <Tela
      rodape={
        <View style={{ gap: 4 }}>
          <Botao
            titulo="Conversar com a equipe"
            onPress={abrirWhatsApp}
            icone={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" />
              </Svg>
            }
          />
          <Botao variante="texto" titulo="Ver minhas missões" onPress={() => irPara(router, '/inicio')} />
        </View>
      }
    >
      <View style={{ gap: 6 }}>
        <Texto variante="sobretitulo">RESULTADO DA TRIAGEM</Texto>
        <Texto variante="subtitulo">{personalizar(textos.titulo, vars)}</Texto>
      </View>

      <Card elevado style={{ paddingTop: 22, paddingBottom: 18, paddingHorizontal: 12, alignItems: 'center', gap: 4, borderRadius: 28 }}>
        <Medidor nivel={resultado.nivel} />
        <View style={{ marginTop: -62, alignItems: 'center', gap: 6 }}>
          <Chip texto={textos.rotulo} tom={resultado.nivel} />
          <Texto variante="legenda">
            {nome} · {faixa?.rotulo}
          </Texto>
        </View>
        <Texto style={{ textAlign: 'center', marginTop: 14, paddingHorizontal: 8 }}>{personalizar(textos.texto, vars)}</Texto>
      </Card>

      <Card style={{ padding: 18, gap: 14 }}>
        <Texto variante="rotulo">Por habilidade</Texto>
        {resultado.areas.map((a) => (
          <View key={a.area} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Texto style={{ fontFamily: fonte.semi, fontSize: 13.5, color: cores.texto }}>{a.rotulo}</Texto>
              <Chip texto={TEXTOS_RESULTADO[a.nivel].rotulo} tom={a.nivel} />
            </View>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: cores.linha }}>
              <View style={{ width: `${a.pontuacao}%`, height: 10, borderRadius: 5, backgroundColor: COR_BARRA[a.nivel] }} />
            </View>
          </View>
        ))}
      </Card>

      {resultado.alertaMarcado ? (
        <Texto style={{ fontFamily: fonte.semi, color: cores.avaliarTexto, textAlign: 'center' }}>{personalizar(AVISO_PEDIATRA, vars)}</Texto>
      ) : null}

      <Texto variante="legenda" style={{ textAlign: 'center', fontSize: 11.5 }}>
        {AVISO_RESULTADO} Conteúdo revisado por {RESPONSAVEL_TECNICA.nome}, fonoaudióloga, {RESPONSAVEL_TECNICA.registro}.
      </Texto>
    </Tela>
  );
}
