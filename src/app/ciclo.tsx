import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CelebracaoConquista, ConfeteAoRedor } from '@/components/animacao';
import { CardRenovacao } from '@/components/CardRenovacao';
import { Icone } from '@/components/navegacao';
import { Numero } from '@/components/numero';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { TherapyTrail } from '@/components/TherapyTrail';
import { Botao, BotaoVoltar, Card } from '@/components/ui';
import { desmarcarSessao, marcarSessao, novoCiclo, progressoCiclo, TAMANHOS_CICLO, type Ciclo } from '@/domain/casa';
import { dataLocal } from '@/domain/diario';
import { marcar, tocar } from '@/servicos/sons';
import { useApp } from '@/state/app';
import { useDadosCrianca } from '@/state/dados';
import { repositorio } from '@/storage/repositorio';
import { cores, fonte, raio, toque } from '@/theme/tokens';

/** Ciclo de sessões na clínica: a família marca cada sessão e acompanha a trilha. Fica só no celular. */
export default function TelaCiclo() {
  const router = useRouter();
  const { criancaAtual } = useApp();
  const dados = useDadosCrianca(criancaAtual?.id);
  const [tamanho, setTamanho] = useState<number>(4);
  const [salvando, setSalvando] = useState(false);
  const [comemorar, setComemorar] = useState(false);
  const [largura, setLargura] = useState(0);

  if (!criancaAtual) return <Redirect href="/" />;
  const nome = criancaAtual.apelido;
  const hoje = new Date();
  const dia = dataLocal(hoje);
  const ciclo = dados?.ciclo ?? null;

  async function gravar(c: Ciclo) {
    setSalvando(true);
    try {
      await repositorio.salvarCiclo(c);
      dados?.recarregar();
    } catch (e) {
      console.error('[ciclo] não salvou', e);
    } finally {
      setSalvando(false);
    }
  }

  async function marcarHoje() {
    if (!ciclo) return;
    const novo = marcarSessao(ciclo, dia);
    if (novo === ciclo) return;
    marcar();
    const completo = progressoCiclo(novo).estagio === 'completo';
    void tocar(completo ? 'completo' : 'missao');
    if (completo) setComemorar(true);
    await gravar(novo);
  }

  const voltar = <BotaoVoltar onPress={() => (router.canGoBack() ? router.back() : router.replace('/inicio'))} />;

  if (dados && !ciclo) {
    return (
      <Tela topo={voltar}>
        <Texto variante="titulo">Ciclo de sessões de {nome}</Texto>
        <Texto>Marque aqui cada sessão na clínica e veja a trilha do ciclo se completar.</Texto>
        <Card style={{ padding: 18, gap: 14 }}>
          <Texto variante="rotulo">Quantas sessões tem o pacote atual?</Texto>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {TAMANHOS_CICLO.map((t) => (
              <Pressable
                key={t}
                accessibilityRole="radio"
                accessibilityState={{ checked: tamanho === t }}
                onPress={() => setTamanho(t)}
                style={({ pressed }) => [s.opcao, tamanho === t && s.opcaoAtiva, pressed && toque]}
              >
                <Texto style={{ fontFamily: fonte.extra, fontSize: 20, color: tamanho === t ? '#fff' : cores.texto }}>{t}</Texto>
                <Texto style={{ fontSize: 12, color: tamanho === t ? '#fff' : cores.texto2 }}>sessões</Texto>
              </Pressable>
            ))}
          </View>
          <Texto variante="legenda">Na dúvida, pergunte na recepção. Um pacote de 1x por semana costuma ter 4 sessões no mês.</Texto>
          <Botao titulo="Começar a trilha" carregando={salvando} onPress={() => gravar(novoCiclo(criancaAtual.id, tamanho, new Date()))} />
        </Card>
        <Texto variante="legenda" style={{ textAlign: 'center' }}>
          Fica só no seu celular. A clínica não recebe nada daqui.
        </Texto>
      </Tela>
    );
  }

  if (!ciclo) return <Tela topo={voltar}>{null}</Tela>;

  const p = progressoCiclo(ciclo);
  const foiHoje = ciclo.sessoes.includes(dia);

  return (
    <Tela topo={voltar}>
      <View onLayout={(e) => setLargura(e.nativeEvent.layout.width)} style={{ gap: 2 }}>
        <Texto variante="legenda" style={{ fontFamily: fonte.negrito, letterSpacing: 0.6, color: cores.marca }}>
          FASE {ciclo.fase}
        </Texto>
        <Texto variante="titulo">Ciclo de sessões de {nome}</Texto>
      </View>

      {p.estagio === 'quase' ? <CardRenovacao restantes={p.restantes} /> : null}

      <Card style={{ padding: 20, gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }} accessible accessibilityLabel={`${p.feitas} de ${p.total} sessões`}>
          <Numero valor={p.feitas} style={{ fontFamily: fonte.extra, fontSize: 40, lineHeight: 46, color: cores.marca }} />
          <Texto style={{ fontFamily: fonte.extra, fontSize: 22, color: cores.texto3 }}>/ {p.total}</Texto>
          <Texto style={{ marginLeft: 6, flex: 1 }}>{p.estagio === 'completo' ? 'ciclo completo!' : p.restantes === 1 ? 'falta 1 sessão' : `faltam ${p.restantes} sessões`}</Texto>
        </View>
        <TherapyTrail total={p.total} feitas={p.feitas} />
      </Card>

      {p.estagio === 'completo' ? (
        <Card style={{ padding: 20, gap: 10, alignItems: 'center' }}>
          <CelebracaoConquista tamanho={150} />
          <Texto variante="rotulo" style={{ textAlign: 'center' }}>
            Fase {ciclo.fase} concluída!
          </Texto>
          <Texto style={{ textAlign: 'center' }}>Cada sessão com constância soma na evolução de {nome}. Quando o próximo pacote começar, abra uma nova trilha.</Texto>
          <View style={{ alignSelf: 'stretch' }}>
            <Botao titulo="Começar novo ciclo" carregando={salvando} onPress={() => gravar(novoCiclo(criancaAtual.id, ciclo.total, new Date(), ciclo.fase + 1))} />
          </View>
        </Card>
      ) : foiHoje ? (
        <View style={s.feitoHoje}>
          <Icone nome="check" cor={cores.marca} tamanho={18} espessura={2.8} />
          <Texto style={{ flex: 1, fontFamily: fonte.semi, color: cores.texto }}>Sessão de hoje marcada.</Texto>
          <Botao variante="texto" titulo="Desfazer" onPress={() => gravar(desmarcarSessao(ciclo, dia))} />
        </View>
      ) : (
        <Botao titulo="Fomos à sessão hoje" carregando={salvando} icone={<Icone nome="check" cor="#fff" tamanho={18} espessura={2.8} />} onPress={marcarHoje} />
      )}

      <Texto variante="legenda" style={{ textAlign: 'center' }}>
        Você marca as sessões aqui e elas ficam só no seu celular.
      </Texto>

      {comemorar ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <ConfeteAoRedor largura={largura} altura={360} />
        </View>
      ) : null}
    </Tela>
  );
}

const s = StyleSheet.create({
  opcao: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: raio.lg, backgroundColor: cores.fundo2, borderWidth: 1, borderColor: cores.linha },
  opcaoAtiva: { backgroundColor: cores.marca, borderColor: cores.marca },
  feitoHoje: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: raio.lg, backgroundColor: cores.marcaSuave },
});
