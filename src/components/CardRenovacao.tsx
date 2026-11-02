import { Linking, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { registrarEvento } from '@/api/cliente';
import { Icone } from '@/components/navegacao';
import { Texto } from '@/components/texto';
import { Botao } from '@/components/ui';
import { TEXTO_RENOVACAO } from '@/domain/casa';
import { linkWhatsAppTexto } from '@/domain/contato';
import { cores, fonte, raio, sombra } from '@/theme/tokens';

/**
 * "Ciclo quase completo": aparece quando faltam até 20% das sessões (10 de 12, 3 de 4).
 * O botão abre o WhatsApp da clínica (EXPO_PUBLIC_WHATSAPP_CLINICA) com o código CONECTA-RENOVA.
 * Não chama o sistema da clínica: o vínculo (src/api/vinculo.ts) está desligado.
 */
export function CardRenovacao({ restantes }: { restantes: number }) {
  function abrir() {
    registrarEvento({ tipo: 'whatsapp_aberto', origem: 'geral' });
    Linking.openURL(linkWhatsAppTexto(TEXTO_RENOVACAO)).catch((e) => console.error('[renovacao] WhatsApp', e));
  }
  return (
    <Animated.View entering={FadeInDown.springify().damping(14)} style={s.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={s.icone}>
          <Icone nome="estrela" cor={cores.marca} tamanho={18} cheio />
        </View>
        <View style={{ flex: 1 }}>
          <Texto style={{ fontFamily: fonte.extra, fontSize: 16, color: cores.texto }}>Seu ciclo de sessões está quase concluído!</Texto>
          <Texto variante="legenda">{restantes === 1 ? 'Falta 1 sessão.' : `Faltam ${restantes} sessões.`} A constância é o que mantém a evolução.</Texto>
        </View>
      </View>
      <Botao titulo="Garantir os próximos horários" onPress={abrir} icone={<Icone nome="chat" cor="#fff" tamanho={17} />} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: { gap: 12, padding: 16, borderRadius: raio.lg, backgroundColor: cores.superficie, borderWidth: 1.5, borderColor: cores.marca, boxShadow: sombra.card },
  icone: { width: 38, height: 38, borderRadius: 12, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' },
});
