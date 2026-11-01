import { useEffect, useRef, useState } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Texto } from '@/components/texto';

/**
 * Número que conta até o valor novo (estilo NumberFlow), sem dependência nova.
 * Respeita "reduzir movimento" do aparelho e mantém o valor final para leitores de tela.
 */
export function Numero({ valor, style, duracao = 650 }: { valor: number; style?: StyleProp<TextStyle>; duracao?: number }) {
  const reduzir = useReducedMotion();
  const [mostrado, setMostrado] = useState(valor);
  const anterior = useRef(valor);

  useEffect(() => {
    const de = anterior.current;
    anterior.current = valor;
    if (reduzir || de === valor) {
      setMostrado(valor);
      return;
    }
    let quadro = 0;
    const inicio = Date.now();
    const passo = () => {
      const t = Math.min(1, (Date.now() - inicio) / duracao);
      const suave = 1 - Math.pow(1 - t, 3);
      setMostrado(Math.round(de + (valor - de) * suave));
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [valor, reduzir, duracao]);

  return (
    <Texto style={[{ fontVariant: ['tabular-nums'] }, style]} accessibilityLabel={String(valor)}>
      {mostrado}
    </Texto>
  );
}
