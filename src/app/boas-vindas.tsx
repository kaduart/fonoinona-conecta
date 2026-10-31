import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, Campo, Interruptor, SetaDireita } from '@/components/ui';
import { idadeParaTriagem, lerData, mascararData } from '@/domain/idade';
import { faixaPara } from '@/domain/triagem';
import { cores, fonte } from '@/theme/tokens';

function Ilustracao() {
  return (
    <Svg width={240} height={200} viewBox="0 0 240 230" accessibilityLabel="Ilustração de um adulto e uma criança conversando">
      <Circle cx={120} cy={110} r={108} fill="#FFFFFF" opacity={0.6} />
      <Circle cx={82} cy={92} r={22} fill="#fff" stroke={cores.marca} strokeWidth={2.4} />
      <Path d="M44 200 C44 150 58 124 82 124 C106 124 120 150 120 200" fill="#fff" stroke={cores.marca} strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={166} cy={134} r={16} fill="#fff" stroke={cores.marcaMedia} strokeWidth={2.4} />
      <Path d="M138 200 C138 176 150 160 166 160 C182 160 194 176 194 200" fill="#fff" stroke={cores.marcaMedia} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M114 160 C126 170 136 172 146 170" stroke={cores.marca} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <Path d="M30 200 H210" stroke={cores.marca} strokeWidth={2} opacity={0.4} />
      <Rect x={104} y={38} width={76} height={34} rx={17} fill={cores.marca} />
      <Path d="M128 70 l-6 10 12 -8z" fill={cores.marca} />
      <SvgText x={142} y={60} textAnchor="middle" fontSize={14} fontWeight="700" fill="#fff">
        ma-mã!
      </SvgText>
    </Svg>
  );
}

export default function BoasVindas() {
  const router = useRouter();
  const [apelido, setApelido] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [prematuro, setPrematuro] = useState(false);
  const [semanas, setSemanas] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  function continuar() {
    const nome = apelido.trim();
    const data = lerData(nascimento);
    const sem = prematuro ? Number(semanas) : null;
    if (!nome) return setErro('Conte como a criança é chamada.');
    if (!data) return setErro('Confira a data de nascimento (DD/MM/AAAA).');
    if (prematuro && (!sem || sem < 22 || sem >= 37)) return setErro('Informe as semanas de gestação (entre 22 e 36).');
    if (!faixaPara(idadeParaTriagem(data, new Date(), sem))) return setErro('O app é para crianças de 0 a 6 anos.');
    setErro(null);
    const iso = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
    router.push({ pathname: '/consentimento', params: { apelido: nome, nascimento: iso, semanas: sem ? String(sem) : '' } });
  }

  return (
    <Tela rodape={<Botao titulo="Começar gratuitamente" onPress={continuar} icone={<SetaDireita />} />}>
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <Ilustracao />
      </View>
      <View style={{ gap: 10 }}>
        <Texto variante="titulo">
          Acompanhe cada <Texto variante="titulo" style={{ color: cores.marca }}>conquista</Texto> do seu filho.
        </Texto>
        <Texto>Triagem do desenvolvimento e brincadeiras diárias criadas por fonoaudiólogas.</Texto>
      </View>
      <View style={{ gap: 10 }}>
        <Campo rotulo="Como a criança é chamada" placeholder="Ex.: Pedrinho" value={apelido} onChangeText={setApelido} maxLength={30} autoCapitalize="words" />
        <Campo
          rotulo="Data de nascimento"
          placeholder="DD/MM/AAAA"
          value={nascimento}
          onChangeText={(t) => setNascimento(mascararData(t))}
          keyboardType="number-pad"
          maxLength={10}
        />
        <Interruptor valor={prematuro} onChange={setPrematuro} titulo="Nasceu prematuro?" descricao="Antes de 37 semanas. Usamos a idade corrigida até os 2 anos." />
        {prematuro ? (
          <Campo rotulo="Semanas de gestação" placeholder="Ex.: 34" value={semanas} onChangeText={(t) => setSemanas(t.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" />
        ) : null}
        {erro ? (
          <Texto accessibilityRole="alert" style={{ color: cores.avaliarTexto, fontFamily: fonte.semi, fontSize: 13.5 }}>
            {erro}
          </Texto>
        ) : null}
      </View>
      <Texto variante="legenda" style={{ textAlign: 'center' }}>
        Seus dados ficam guardados no seu celular.
      </Texto>
    </Tela>
  );
}

