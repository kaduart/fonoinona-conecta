import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { registrarEvento, registrarLead } from '@/api/cliente';
import { Medidor } from '@/components/medidor';
import { irPara } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, Card } from '@/components/ui';
import { FAIXAS } from '@/content/perguntas';
import { AVISO_PEDIATRA, AVISO_RESULTADO, CHAMADA_RESULTADO, CTA_RESULTADO, DESCRICAO_AREA, RESPONSAVEL_TECNICA, TEXTOS_RESULTADO } from '@/content/resultados';
import { codigoContato, linkWhatsApp } from '@/domain/contato';
import { formatarIdade } from '@/domain/idade';
import { personalizar, type NivelResultado, type ResultadoArea } from '@/domain/triagem';
import { useApp } from '@/state/app';
import { repositorio, type TriagemSalva } from '@/storage/repositorio';
import { cores, fonte, raio, sombra } from '@/theme/tokens';

const BADGE: Record<NivelResultado, { fundo: string; borda: string; texto: string; ponto: string }> = {
  esperado: { fundo: 'rgba(43,181,154,0.12)', borda: 'rgba(43,181,154,0.25)', texto: cores.esperadoTexto, ponto: cores.esperado },
  observar: { fundo: 'rgba(242,184,75,0.16)', borda: 'rgba(242,184,75,0.30)', texto: '#9A6A0B', ponto: '#F2B84B' },
  avaliar: { fundo: 'rgba(255,122,107,0.12)', borda: 'rgba(255,122,107,0.28)', texto: cores.avaliarTexto, ponto: cores.avaliar },
};

const ICONE_AREA: Record<string, string> = {
  fala: '🗣️', compreensao: '👂', interacao: '🤝', audicao: '🎵', motricidade_oral: '👄', alimentacao: '🥄',
  imitacao: '🪞', gestos: '👉', brincar: '🧸', narrativa: '📖', inteligibilidade: '💬', consciencia_fonologica: '🔤',
};

/** "fala e motricidade oral" / "fala, brincar e gestos". */
function juntar(itens: string[]) {
  if (itens.length <= 1) return itens[0] ?? '';
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

function Badge({ nivel }: { nivel: NivelResultado }) {
  const b = BADGE[nivel];
  return (
    <View style={[s.badge, { backgroundColor: b.fundo, borderColor: b.borda }]}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: b.ponto }} />
      <Texto style={{ fontFamily: fonte.negrito, fontSize: 12, color: b.texto }}>{TEXTOS_RESULTADO[nivel].rotulo}</Texto>
    </View>
  );
}

function CardHabilidade({ a }: { a: ResultadoArea }) {
  const falta = Math.max(0, 100 - a.pontuacao);
  return (
    <View style={s.habilidade}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={s.habIcone}>
          <Texto style={{ fontSize: 18 }}>{ICONE_AREA[a.area] ?? '⭐'}</Texto>
        </View>
        <View style={{ flex: 1 }}>
          <Texto style={{ fontFamily: fonte.negrito, fontSize: 15, color: cores.texto }}>{a.rotulo}</Texto>
          <Texto variante="legenda">{DESCRICAO_AREA[a.area]}</Texto>
        </View>
        <Badge nivel={a.nivel} />
      </View>
      <View style={s.trilho} accessibilityLabel={`${a.rotulo}: ${a.pontuacao}% desenvolvido`}>
        <Svg width={`${Math.max(6, a.pontuacao)}%`} height={10}>
          <Defs>
            <LinearGradient id={`b-${a.area}`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FFB27A" />
              <Stop offset="0.5" stopColor="#F2B84B" />
              <Stop offset="1" stopColor="#3CC4A6" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height={10} rx={5} fill={`url(#b-${a.area})`} />
        </Svg>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Texto variante="legenda">{a.pontuacao}% desenvolvido</Texto>
        {falta > 0 ? <Texto style={{ fontFamily: fonte.semi, fontSize: 12, color: cores.marca }}>faltam {falta}%</Texto> : null}
      </View>
    </View>
  );
}

/** Botão principal da tela: degradê verde → azul, ícone do WhatsApp e sub-legenda. */
function BotaoWhatsApp({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${CTA_RESULTADO.titulo}. ${CTA_RESULTADO.apoio}`}
      onPress={onPress}
      style={({ pressed }) => [s.cta, pressed && { transform: [{ scale: 0.985 }], opacity: 0.95 }]}
    >
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="cta" x1="0" y1="0" x2="1" y2="0.3">
            <Stop offset="0" stopColor="#18B88F" />
            <Stop offset="0.55" stopColor="#16A3B5" />
            <Stop offset="1" stopColor="#2E7CF6" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill="url(#cta)" />
      </Svg>
      <View style={s.wa}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="#fff">
          <Path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.3z" />
        </Svg>
      </View>
      <View style={{ flex: 1 }}>
        <Texto style={{ fontFamily: fonte.extra, fontSize: 15.5, lineHeight: 20, color: '#fff' }}>👉 {CTA_RESULTADO.titulo}</Texto>
        <Texto style={{ fontFamily: fonte.media, fontSize: 11.5, lineHeight: 15, color: 'rgba(255,255,255,0.88)', marginTop: 2 }}>{CTA_RESULTADO.apoio}</Texto>
      </View>
    </Pressable>
  );
}

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
  const foco = resultado.areas.filter((a) => a.nivel !== 'esperado');
  const noEsperado = resultado.areas.length - foco.length;
  const vars = { nome, faixa: faixa?.rotulo ?? '', areas: juntar(foco.map((a) => a.rotulo.toLowerCase())) };
  const chamada = CHAMADA_RESULTADO[resultado.nivel];
  const idade = formatarIdade(triagem.idadeMeses);
  const idadeCurta = triagem.idadeMeses < 24 ? idade : `${Math.floor(triagem.idadeMeses / 12)} anos`;
  const visiveis = foco.length ? foco : resultado.areas;

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
        <View style={{ gap: 6, alignItems: 'center' }}>
          <BotaoWhatsApp onPress={abrirWhatsApp} />
          <Texto variante="legenda" style={{ fontSize: 11.5 }}>
            🔒 Sem compromisso · Seus dados não são enviados
          </Texto>
          <Botao variante="texto" titulo="Ver minhas missões" onPress={() => irPara(router, '/trilha')} />
        </View>
      }
    >
      <View style={{ gap: 10, paddingTop: 6 }}>
        <Texto variante="sobretitulo">
          RESULTADO DA TRIAGEM · {nome.toUpperCase()}, {idadeCurta.toUpperCase()}
        </Texto>
        <Texto style={s.manchete}>{personalizar(chamada.titulo, vars)}</Texto>
        <Texto style={s.apoio}>{personalizar(chamada.texto, vars)}</Texto>
      </View>

      <Card style={{ paddingTop: 26, paddingBottom: 22, paddingHorizontal: 12, alignItems: 'center', gap: 8 }}>
        <Medidor nivel={resultado.nivel} noEsperado={noEsperado} total={resultado.areas.length} />
        <Badge nivel={resultado.nivel} />
      </Card>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 4 }}>
        <Texto style={{ fontFamily: fonte.extra, fontSize: 16, color: cores.texto }}>{foco.length ? 'Onde focar agora' : 'Por habilidade'}</Texto>
        <Texto variante="legenda">{visiveis.length === 1 ? '1 habilidade' : `${visiveis.length} habilidades`}</Texto>
      </View>
      {visiveis.map((a) => (
        <CardHabilidade key={a.area} a={a} />
      ))}

      {resultado.alertaMarcado ? (
        <Texto style={{ fontFamily: fonte.semi, color: cores.avaliarTexto, textAlign: 'center' }}>{personalizar(AVISO_PEDIATRA, vars)}</Texto>
      ) : null}

      <Card style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: raio.lg }}>
        <View style={s.rt}>
          <Texto style={{ fontFamily: fonte.extra, color: cores.marca, fontSize: 16 }}>LS</Texto>
          <View style={s.online} />
        </View>
        <View style={{ flex: 1 }}>
          <Texto style={{ fontFamily: fonte.negrito, fontSize: 14, color: cores.texto }}>{RESPONSAVEL_TECNICA.nome}</Texto>
          <Texto variante="legenda">Fonoaudióloga · {RESPONSAVEL_TECNICA.registro}</Texto>
        </View>
      </Card>

      <Texto variante="legenda" style={{ textAlign: 'center', fontSize: 11 }}>
        {AVISO_RESULTADO}
      </Texto>
    </Tela>
  );
}

const s = StyleSheet.create({
  manchete: { fontFamily: fonte.extra, fontSize: 27, lineHeight: 32, letterSpacing: -0.7, color: cores.texto },
  apoio: { fontSize: 14.5, lineHeight: 22, color: cores.texto2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 12, borderRadius: raio.pill, borderWidth: 1 },
  habilidade: { backgroundColor: cores.superficie, borderRadius: 20, padding: 18, gap: 12, boxShadow: '0px 10px 26px rgba(44, 62, 63, 0.06)' },
  habIcone: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#FDF3DC', alignItems: 'center', justifyContent: 'center' },
  trilho: { height: 10, borderRadius: 5, backgroundColor: '#EDF3F2', overflow: 'hidden' },
  cta: { width: '100%', minHeight: 70, borderRadius: 24, overflow: 'hidden', paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14, boxShadow: '0px 16px 32px rgba(36, 140, 190, 0.32)' },
  wa: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  rt: { width: 48, height: 48, borderRadius: 16, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' },
  online: { position: 'absolute', right: -3, bottom: -3, width: 14, height: 14, borderRadius: 7, backgroundColor: '#3BB273', borderWidth: 3, borderColor: '#fff' },
});
