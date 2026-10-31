import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { registrarEvento, registrarLead } from '@/api/cliente';
import { Medidor } from '@/components/medidor';
import { irPara } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao } from '@/components/ui';
import { FAIXAS } from '@/content/perguntas';
import {
  AVISO_PEDIATRA,
  AVISO_RESULTADO,
  CHAMADA_RESULTADO,
  CTA_RESULTADO,
  DESCRICAO_AREA,
  DICA_AREA,
  PONTE_CLINICA,
  RESPONSAVEL_TECNICA,
  TEXTOS_RESULTADO,
} from '@/content/resultados';
import { formatarDataCurta } from '@/domain/acompanhamento';
import { codigoContato, linkWhatsApp, resumoTriagem } from '@/domain/contato';
import { formatarIdade } from '@/domain/idade';
import { contarHabilidades, personalizar, type NivelResultado, type ResultadoArea } from '@/domain/triagem';
import { useApp } from '@/state/app';
import { repositorio, type TriagemSalva } from '@/storage/repositorio';
import { cores, fonte, raio } from '@/theme/tokens';

const ESCURO = '#12232A';
const MARCA = require('../../assets/images/marca.png');

const BADGE: Record<NivelResultado, { fundo: string; borda: string; texto: string; ponto: string }> = {
  esperado: { fundo: 'rgba(43,181,154,0.18)', borda: 'rgba(95,195,168,0.35)', texto: '#7FE0C4', ponto: '#5FC3A8' },
  observar: { fundo: 'rgba(242,184,75,0.16)', borda: 'rgba(242,184,75,0.35)', texto: '#F7C96E', ponto: '#F2B84B' },
  avaliar: { fundo: 'rgba(255,122,107,0.16)', borda: 'rgba(255,122,107,0.35)', texto: '#FF9E92', ponto: '#FF7A6B' },
};
const BADGE_CLARO: Record<NivelResultado, { fundo: string; borda: string; texto: string; ponto: string }> = {
  esperado: { fundo: 'rgba(43,181,154,0.12)', borda: 'rgba(43,181,154,0.25)', texto: cores.esperadoTexto, ponto: cores.esperado },
  observar: { fundo: 'rgba(242,184,75,0.14)', borda: 'rgba(242,184,75,0.32)', texto: '#9A6A0B', ponto: '#F2B84B' },
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

function Badge({ nivel, escuro }: { nivel: NivelResultado; escuro?: boolean }) {
  const b = (escuro ? BADGE : BADGE_CLARO)[nivel];
  return (
    <View style={[s.badge, { backgroundColor: b.fundo, borderColor: b.borda }]}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: b.ponto }} />
      <Texto style={{ fontFamily: fonte.negrito, fontSize: 12, color: b.texto }}>{TEXTOS_RESULTADO[nivel].rotulo}</Texto>
    </View>
  );
}

function Check({ cor = cores.marca, tamanho = 12 }: { cor?: string; tamanho?: number }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  );
}

function CardFoco({ a }: { a: ResultadoArea }) {
  const falta = Math.max(0, 100 - a.pontuacao);
  return (
    <View style={s.foco}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={s.focoIcone}>
          <Texto style={{ fontSize: 19 }}>{ICONE_AREA[a.area] ?? '⭐'}</Texto>
        </View>
        <View style={{ flex: 1 }}>
          <Texto style={{ fontFamily: fonte.extra, fontSize: 15.5, letterSpacing: -0.2, color: cores.texto }}>{a.rotulo}</Texto>
          <Texto variante="legenda">{DESCRICAO_AREA[a.area]}</Texto>
        </View>
        <Badge nivel={a.nivel} />
      </View>
      <View style={{ gap: 8 }}>
        <View style={s.trilho} accessibilityLabel={`${a.rotulo}: ${a.pontuacao}% desenvolvido, faltam ${falta}%`}>
          <Svg width={`${Math.max(6, a.pontuacao)}%`} height={8}>
            <Defs>
              <LinearGradient id={`b-${a.area}`} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#FFB27A" />
                <Stop offset="0.55" stopColor="#F2B84B" />
                <Stop offset="1" stopColor="#3CC4A6" />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width="100%" height={8} rx={4} fill={`url(#b-${a.area})`} />
          </Svg>
        </View>
        <Texto style={{ fontSize: 12.5, color: cores.texto2 }}>
          <Texto style={{ fontFamily: fonte.negrito, fontSize: 12.5, color: cores.texto }}>{a.pontuacao}% desenvolvido</Texto>
          {falta > 0 ? `  •  faltam ${falta}%` : ''}
        </Texto>
      </View>
      {DICA_AREA[a.area] ? (
        <View style={s.dica}>
          <Texto style={{ fontSize: 13, lineHeight: 19, color: cores.texto }}>
            <Texto style={{ fontFamily: fonte.extra, fontSize: 13, color: cores.solTexto }}>💡 Dica da Fono: </Texto>
            {DICA_AREA[a.area]}
          </Texto>
        </View>
      ) : null}
    </View>
  );
}

/** CTA: degradê vivo verde → azul, ícone do WhatsApp e micro-texto dentro do botão. */
function BotaoWhatsApp({ titulo, apoio, onPress }: { titulo: string; apoio: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. ${apoio}`}
      onPress={onPress}
      style={({ pressed }) => [s.cta, pressed && { transform: [{ scale: 0.985 }], opacity: 0.96 }]}
    >
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="cta" x1="0" y1="0" x2="1" y2="0.4">
            <Stop offset="0" stopColor="#14C08F" />
            <Stop offset="0.5" stopColor="#12A7B8" />
            <Stop offset="1" stopColor="#2F74F5" />
          </LinearGradient>
          <LinearGradient id="ctaLuz" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fff" stopOpacity={0.1} />
            <Stop offset="0.5" stopColor="#fff" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill="url(#cta)" />
        <Rect x={0} y={0} width={100} height={100} fill="url(#ctaLuz)" />
      </Svg>
      <View style={s.wa}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="#fff">
          <Path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.3z" />
        </Svg>
      </View>
      <View style={{ flex: 1 }}>
        <Texto style={{ fontFamily: fonte.extra, fontSize: 16, lineHeight: 20, letterSpacing: -0.2, color: '#fff' }}>{titulo}</Texto>
        <Texto style={{ fontFamily: fonte.media, fontSize: 12, lineHeight: 16, color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>{apoio}</Texto>
      </View>
    </Pressable>
  );
}

export default function ResultadoTela() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { criancaAtual } = useApp();
  const [triagem, setTriagem] = useState<TriagemSalva | null>(null);
  const [incluirResumo, setIncluirResumo] = useState(false);

  useEffect(() => {
    if (id) repositorio.lerTriagem(id).then(setTriagem);
  }, [id]);

  if (!triagem || !criancaAtual) return <Tela>{null}</Tela>;

  const { resultado } = triagem;
  const faixa = FAIXAS.find((f) => f.id === triagem.faixaId);
  const nome = criancaAtual.apelido;
  const foco = resultado.areas.filter((a) => a.nivel !== 'esperado');
  const fortes = resultado.areas.filter((a) => a.nivel === 'esperado');
  const habilidades = contarHabilidades(triagem.respostas);
  const vars = { nome, faixa: faixa?.rotulo ?? '', areas: juntar(foco.map((a) => a.rotulo.toLowerCase())) };
  const chamada = CHAMADA_RESULTADO[resultado.nivel];
  const idade = formatarIdade(triagem.idadeMeses);
  const idadeCurta = triagem.idadeMeses < 24 ? idade : `${Math.floor(triagem.idadeMeses / 12)} anos`;
  const tituloCta = personalizar(CTA_RESULTADO.titulo, vars);
  const codigo = codigoContato(triagem.id);
  const resumo = resumoTriagem(foco.map((a) => a.rotulo), habilidades.noEsperado, habilidades.total);

  function abrirWhatsApp() {
    const url = linkWhatsApp(resultado.nivel, idade, codigo, undefined, incluirResumo ? resumo : undefined);
    registrarEvento({ tipo: 'whatsapp_aberto', origem: 'resultado' });
    registrarLead(codigo, 'resultado', triagem!.faixaId);
    Linking.openURL(url).catch((e) => console.error('[resultado] não abriu o WhatsApp', e));
  }

  return (
    <Tela
      rodape={
        <View style={{ gap: 6, alignItems: 'center' }}>
          <BotaoWhatsApp titulo={tituloCta} apoio={personalizar(CTA_RESULTADO.apoio, vars)} onPress={abrirWhatsApp} />
          <Botao variante="texto" titulo="Ver minhas missões" onPress={() => irPara(router, '/trilha')} />
        </View>
      }
    >
      {/* 1. Cabeçalho clínico escuro */}
      <View style={s.escuro}>
        <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="luz1" cx="0.9" cy="0" r="0.75">
              <Stop offset="0" stopColor="#2BB59A" stopOpacity={0.28} />
              <Stop offset="1" stopColor="#2BB59A" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={100} height={100} fill="url(#luz1)" />
        </Svg>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={s.avatarAnel}>
            <View style={s.avatar}>
              <Texto style={{ fontFamily: fonte.extra, fontSize: 20, color: '#fff' }}>{nome.slice(0, 1).toUpperCase()}</Texto>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Texto style={{ fontFamily: fonte.extra, fontSize: 17, letterSpacing: -0.3, color: '#fff' }}>
              {nome} • {idadeCurta}
            </Texto>
            <Texto style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>Triagem de {formatarDataCurta(new Date(triagem.criadaEm))}</Texto>
          </View>
          <View style={s.logo}>
            <Image source={MARCA} style={{ width: 26, height: 26 }} contentFit="contain" />
          </View>
        </View>

        <View style={{ marginTop: 22, alignItems: 'center' }}>
          <Medidor nivel={resultado.nivel} noEsperado={habilidades.noEsperado} total={habilidades.total} escuro />
          <View style={{ marginTop: 8 }}>
            <Badge nivel={resultado.nivel} escuro />
          </View>
        </View>

        <View style={s.escuroDivisor} />
        <Texto style={{ fontFamily: fonte.extra, fontSize: 19, lineHeight: 24, letterSpacing: -0.4, color: '#fff' }}>{personalizar(chamada.titulo, vars)}</Texto>
        <Texto style={{ fontSize: 13.5, lineHeight: 20, color: 'rgba(255,255,255,0.72)', marginTop: 6 }}>{personalizar(chamada.texto, vars)}</Texto>
      </View>

      {/* 2. Pontos fortes */}
      {fortes.length ? (
        <View style={{ gap: 12 }}>
          <Texto style={s.secao}>Pontos fortes</Texto>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {fortes.map((a) => (
              <View key={a.area} style={s.selo}>
                <View style={s.seloCheck}>
                  <Check cor="#fff" tamanho={10} />
                </View>
                <Texto style={{ fontFamily: fonte.semi, fontSize: 13, color: cores.marca }}>{a.rotulo}</Texto>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* 3. Onde focar agora */}
      {foco.length ? (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Texto style={s.secao}>Onde focar agora</Texto>
            <Texto variante="legenda">{foco.length === 1 ? '1 habilidade' : `${foco.length} habilidades`}</Texto>
          </View>
          {foco.map((a) => (
            <CardFoco key={a.area} a={a} />
          ))}
        </View>
      ) : null}

      {resultado.alertaMarcado ? (
        <Texto style={{ fontFamily: fonte.semi, color: cores.avaliarTexto, textAlign: 'center' }}>{personalizar(AVISO_PEDIATRA, vars)}</Texto>
      ) : null}

      {/* 4. Ponte para a clínica: quem responde e o que acontece ao tocar no botão */}
      <View style={s.ponte}>
        <Texto style={s.ponteRotulo}>{PONTE_CLINICA.rotulo.toUpperCase()}</Texto>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View>
            <View style={s.rtAvatar}>
              <Texto style={{ fontFamily: fonte.extra, color: cores.marca, fontSize: 17 }}>LS</Texto>
            </View>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Texto style={{ fontFamily: fonte.extra, fontSize: 15, letterSpacing: -0.2, color: cores.texto }}>{RESPONSAVEL_TECNICA.nome}</Texto>
            <Texto variante="legenda">Fonoaudióloga • {RESPONSAVEL_TECNICA.registro}</Texto>
            <Texto style={{ fontFamily: fonte.semi, fontSize: 12, color: cores.texto2 }}>{PONTE_CLINICA.horario}</Texto>
          </View>
        </View>

        <View style={s.ponteDivisor} />
        <Texto style={{ fontFamily: fonte.extra, fontSize: 16, letterSpacing: -0.3, color: cores.texto }}>{PONTE_CLINICA.titulo}</Texto>
        <View style={{ gap: 0 }}>
          {PONTE_CLINICA.passos.map((p, i) => (
            <View key={p} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ alignItems: 'center' }}>
                <View style={s.passoNum}>
                  <Texto style={{ fontFamily: fonte.extra, fontSize: 12, color: '#fff' }}>{i + 1}</Texto>
                </View>
                {i < PONTE_CLINICA.passos.length - 1 ? <View style={s.passoLinha} /> : null}
              </View>
              <View style={{ flex: 1, paddingTop: 2, paddingBottom: i < PONTE_CLINICA.passos.length - 1 ? 14 : 0, gap: 6 }}>
                <Texto style={{ fontSize: 13.5, lineHeight: 19, color: cores.texto }}>{personalizar(p, vars)}</Texto>
                {i === 0 ? (
                  <View style={s.codigo}>
                    <Texto style={{ fontFamily: fonte.extra, fontSize: 12.5, letterSpacing: 0.6, color: cores.marca }}>{codigo}</Texto>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: incluirResumo }}
          onPress={() => setIncluirResumo((v) => !v)}
          style={[s.opcao, incluirResumo && s.opcaoAtiva]}
        >
          <View style={[s.caixa, incluirResumo && s.caixaAtiva]}>{incluirResumo ? <Check cor="#fff" tamanho={13} /> : null}</View>
          <View style={{ flex: 1, gap: 2 }}>
            <Texto style={{ fontFamily: fonte.negrito, fontSize: 13.5, color: cores.texto }}>{PONTE_CLINICA.opcao}</Texto>
            {PONTE_CLINICA.opcaoApoio ? <Texto style={{ fontSize: 12, lineHeight: 17, color: cores.texto2 }}>{PONTE_CLINICA.opcaoApoio}</Texto> : null}
          </View>
        </Pressable>
        {incluirResumo ? (
          <View style={s.previa}>
            <Texto style={{ fontFamily: fonte.semi, fontSize: 12, color: cores.texto2 }}>{PONTE_CLINICA.previa}</Texto>
            <Texto style={{ fontSize: 13, lineHeight: 19, color: cores.texto }}>{resumo}</Texto>
          </View>
        ) : null}
        <View style={s.privacidade}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={cores.marca} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Rect x={5} y={11} width={14} height={10} rx={2.5} />
            <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </Svg>
          <Texto style={{ flex: 1, fontSize: 11.5, lineHeight: 16, color: cores.texto2 }}>
            {incluirResumo ? PONTE_CLINICA.privacidadeComResumo : PONTE_CLINICA.privacidade}
          </Texto>
        </View>
      </View>

      <Texto style={{ textAlign: 'center', fontSize: 11.5, lineHeight: 17, color: cores.texto2 }}>
        {AVISO_RESULTADO}
      </Texto>
    </Tela>
  );
}

const s = StyleSheet.create({
  escuro: { backgroundColor: ESCURO, borderRadius: 28, padding: 22, overflow: 'hidden', boxShadow: '0px 20px 40px rgba(18, 35, 42, 0.28)' },
  avatarAnel: { width: 54, height: 54, borderRadius: 27, padding: 2, backgroundColor: 'rgba(95,195,168,0.55)' },
  avatar: { flex: 1, borderRadius: 25, backgroundColor: '#1F7A6B', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: ESCURO },
  logo: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  escuroDivisor: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 20, marginBottom: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 12, borderRadius: raio.pill, borderWidth: 1 },
  secao: { fontFamily: fonte.extra, fontSize: 17, letterSpacing: -0.3, color: cores.texto },
  selo: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 34, paddingLeft: 7, paddingRight: 13, borderRadius: raio.pill, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(31,122,107,0.16)', boxShadow: '0px 6px 14px rgba(31, 122, 107, 0.08)' },
  seloCheck: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#2BB59A', alignItems: 'center', justifyContent: 'center' },
  foco: { backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 14, boxShadow: '0px 14px 34px rgba(44, 62, 63, 0.07)' },
  focoIcone: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FDF3DC', alignItems: 'center', justifyContent: 'center' },
  trilho: { height: 8, borderRadius: 4, backgroundColor: '#EDF3F2', overflow: 'hidden' },
  dica: { backgroundColor: '#FFF9EC', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(242,184,75,0.22)' },
  ponte: { backgroundColor: '#fff', borderRadius: 24, padding: 20, gap: 14, borderWidth: 1, borderColor: 'rgba(31,122,107,0.12)', boxShadow: '0px 14px 34px rgba(44, 62, 63, 0.07)' },
  ponteRotulo: { fontFamily: fonte.extra, fontSize: 11, letterSpacing: 1.2, color: cores.marca },
  ponteDivisor: { height: 1, backgroundColor: '#EDF3F2' },
  luzAvatar: { position: 'absolute', right: -2, bottom: -2, width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, borderColor: '#fff' },
  passoNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: cores.marca, alignItems: 'center', justifyContent: 'center' },
  passoLinha: { flex: 1, width: 2, backgroundColor: 'rgba(31,122,107,0.18)', marginVertical: 3 },
  codigo: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: cores.marcaSuave, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(31,122,107,0.35)' },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: '#E3ECEA', backgroundColor: '#fff' },
  opcaoAtiva: { borderColor: cores.marca, backgroundColor: '#F2FAF7' },
  caixa: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: '#B9C8C6', alignItems: 'center', justifyContent: 'center' },
  caixaAtiva: { backgroundColor: cores.marca, borderColor: cores.marca },
  previa: { gap: 4, padding: 14, borderRadius: 14, backgroundColor: '#F2FAF7', borderLeftWidth: 3, borderLeftColor: cores.marca },
  privacidade: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F4F8F7', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  rt: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 20, padding: 16, boxShadow: '0px 12px 30px rgba(44, 62, 63, 0.05)' },
  rtAvatar: { width: 50, height: 50, borderRadius: 17, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' },
  luz: { width: 8, height: 8, borderRadius: 4 },
  cta: { width: '100%', minHeight: 72, borderRadius: 24, overflow: 'hidden', paddingVertical: 14, paddingLeft: 14, paddingRight: 18, flexDirection: 'row', alignItems: 'center', gap: 14, boxShadow: '0px 18px 36px rgba(32, 140, 200, 0.35)' },
  wa: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
});
