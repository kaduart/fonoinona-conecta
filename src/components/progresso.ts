import { useEffect, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

const suave = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Valor de 0 a 1 que cresce uma vez (easing out cúbico), para desenhar arcos, barras e contagens.
 * Com "reduzir movimento" ou `ativo` falso, já começa em 1.
 */
export function useProgresso(ativo: boolean, duracao = 1200, atraso = 0): number {
  const reduzir = useReducedMotion();
  const animar = ativo && !reduzir;
  const [p, setP] = useState(animar ? 0 : 1);
  useEffect(() => {
    if (!animar) {
      setP(1);
      return;
    }
    let quadro = 0;
    let inicio = 0;
    const passo = (agora: number) => {
      if (!inicio) inicio = agora;
      const t = Math.min(1, Math.max(0, (agora - inicio - atraso) / duracao));
      setP(suave(t));
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [animar, duracao, atraso]);
  return p;
}
