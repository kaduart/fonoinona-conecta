import { Linking, StyleSheet, View } from 'react-native';

import { registrarEvento } from '@/api/cliente';
import { Icone } from '@/components/navegacao';
import { Texto } from '@/components/texto';
import { Botao } from '@/components/ui';
import { linkIndicacao } from '@/domain/contato';
import { cores, fonte, raio, sombra } from '@/theme/tokens';

/**
 * "Indicar para outra família": abre o WhatsApp com o convite e o link do app, sem destinatário
 * (a família escolhe para quem mandar). Nada da criança vai na mensagem.
 */
export function CardIndicar() {
  function indicar() {
    registrarEvento({ tipo: 'app_indicado' });
    Linking.openURL(linkIndicacao()).catch((e) => console.error('[indicar] WhatsApp', e));
  }
  return (
    <View style={s.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={s.icone}>
          <Icone nome="presente" cor={cores.marca} tamanho={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Texto style={{ fontFamily: fonte.extra, fontSize: 16, color: cores.texto }}>Conhece outra família?</Texto>
          <Texto variante="legenda">O app é gratuito. Mande o link para quem também tem criança pequena.</Texto>
        </View>
      </View>
      <Botao titulo="Indicar pelo WhatsApp" onPress={indicar} icone={<Icone nome="compartilhar" cor="#fff" tamanho={17} />} />
    </View>
  );
}

const s = StyleSheet.create({
  card: { gap: 12, padding: 16, borderRadius: raio.lg, backgroundColor: cores.superficie, boxShadow: sombra.card },
  icone: { width: 38, height: 38, borderRadius: 12, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' },
});
