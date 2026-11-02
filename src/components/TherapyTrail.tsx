import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Icone } from '@/components/navegacao';
import { Texto } from '@/components/texto';
import { cores, fonte } from '@/theme/tokens';

// Trilha do ciclo de sessões: um nó por sessão, ligados por linha pontilhada.
// Feito = verde da marca com check; próximo = contorno pontilhado; futuro = apagado.
// Em tamanho cheio, a trilha desce em zigue-zague (4 por linha). No modo compacto, cabe numa linha só.

type Estado = 'feito' | 'proximo' | 'futuro';

const POR_LINHA = 4;
const NO = 44;
const NO_COMPACTO = 14;

function estadoDe(i: number, feitas: number): Estado {
  return i < feitas ? 'feito' : i === feitas ? 'proximo' : 'futuro';
}

export function TherapyTrail({ total, feitas, compacto = false }: { total: number; feitas: number; compacto?: boolean }) {
  const n = Math.max(1, Math.round(total));
  const f = Math.min(Math.max(0, Math.round(feitas)), n);
  const rotulo = `${f} de ${n} sessões do ciclo`;

  if (compacto) {
    return (
      <View style={s.linhaCompacta} accessible accessibilityLabel={rotulo}>
        {Array.from({ length: n }, (_, i) => {
          const e = estadoDe(i, f);
          return (
            <Fragment key={i}>
              {i > 0 ? <View style={[s.ligacaoCompacta, i < f ? s.ligacaoFeita : s.ligacaoPontilhada]} /> : null}
              <Animated.View
                key={`${i}-${e}`}
                entering={e === 'feito' ? ZoomIn.springify().damping(12) : undefined}
                style={[s.noCompacto, e === 'feito' && s.noFeito, e === 'proximo' && s.noProximo, e === 'futuro' && s.noFuturo]}
              />
            </Fragment>
          );
        })}
      </View>
    );
  }

  const linhas: number[][] = [];
  for (let i = 0; i < n; i += POR_LINHA) linhas.push(Array.from({ length: Math.min(POR_LINHA, n - i) }, (_, k) => i + k));

  return (
    <View accessible accessibilityLabel={rotulo} style={{ gap: 0 }}>
      {linhas.map((linha, li) => {
        const invertida = li % 2 === 1;
        const ultimaLinha = li === linhas.length - 1;
        // a ligação vertical sai do lado em que a linha termina
        const ladoDaDescida = invertida ? 'flex-start' : 'flex-end';
        const proximoDaDescida = linha[linha.length - 1] + 1;
        const cheia = linha.length === POR_LINHA;
        return (
          <View key={li}>
            <View style={[s.linha, invertida && { flexDirection: 'row-reverse' }, !cheia && { justifyContent: 'flex-start' }]}>
              {linha.map((i, k) => (
                <Fragment key={i}>
                  {k > 0 ? <View style={[s.ligacao, i < f ? s.ligacaoFeita : s.ligacaoPontilhada]} /> : null}
                  <No indice={i} estado={estadoDe(i, f)} ultimo={i === n - 1} />
                </Fragment>
              ))}
              {/* linha incompleta: completa o espaço para os nós ficarem alinhados com a de cima */}
              {!cheia ? Array.from({ length: POR_LINHA - linha.length }, (_, k) => <View key={`v${k}`} style={{ flex: 1, marginLeft: NO + 8 }} />) : null}
            </View>
            {!ultimaLinha ? (
              <View style={{ alignItems: ladoDaDescida, paddingHorizontal: NO / 2 - 1 }}>
                <View style={[s.descida, proximoDaDescida < f ? s.descidaFeita : s.descidaPontilhada]} />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function No({ indice, estado, ultimo }: { indice: number; estado: Estado; ultimo: boolean }) {
  const numero = (
    <Texto style={{ fontFamily: fonte.negrito, fontSize: 15, color: estado === 'proximo' ? cores.marca : cores.texto3 }}>{indice + 1}</Texto>
  );
  return (
    <Animated.View
      // a chave muda com o estado: quando a sessão é marcada, o nó entra de novo com o "pop"
      key={`${indice}-${estado}`}
      entering={estado === 'feito' ? ZoomIn.springify().damping(11) : undefined}
      style={[s.no, estado === 'feito' && s.noFeito, estado === 'proximo' && s.noProximo, estado === 'futuro' && s.noFuturo]}
    >
      {estado === 'feito' ? (
        <Icone nome={ultimo ? 'estrela' : 'check'} cor="#fff" tamanho={ultimo ? 20 : 18} espessura={2.8} cheio={ultimo} />
      ) : ultimo ? (
        <Icone nome="estrela" cor={estado === 'proximo' ? cores.marca : cores.texto3} tamanho={20} />
      ) : (
        numero
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center' },
  no: { width: NO, height: NO, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  noFeito: { backgroundColor: cores.marca },
  noProximo: { backgroundColor: cores.superficie, borderWidth: 2, borderStyle: 'dashed', borderColor: cores.marca },
  noFuturo: { backgroundColor: cores.fundo2, opacity: 0.55 },
  ligacao: { flex: 1, height: 0, marginHorizontal: 4 },
  ligacaoFeita: { borderTopWidth: 3, borderColor: cores.marca, borderStyle: 'solid' },
  ligacaoPontilhada: { borderTopWidth: 2, borderColor: cores.linha, borderStyle: 'dashed' },
  descida: { width: 0, height: 22, marginVertical: 4 },
  descidaFeita: { borderLeftWidth: 3, borderColor: cores.marca, borderStyle: 'solid' },
  descidaPontilhada: { borderLeftWidth: 2, borderColor: cores.linha, borderStyle: 'dashed' },
  linhaCompacta: { flexDirection: 'row', alignItems: 'center' },
  noCompacto: { width: NO_COMPACTO, height: NO_COMPACTO, borderRadius: 5 },
  ligacaoCompacta: { flex: 1, height: 0, marginHorizontal: 2 },
});
