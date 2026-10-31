import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, View } from 'react-native';

import { irPara, Marca } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, BotaoVoltar, Campo, Interruptor, SetaDireita } from '@/components/ui';
import { ILUSTRACOES } from '@/content/ilustracoes';
import { idadeParaTriagem, lerData, mascararData } from '@/domain/idade';
import { faixaPara } from '@/domain/triagem';
import { useApp } from '@/state/app';
import { novoId, repositorio } from '@/storage/repositorio';
import { cores, fonte } from '@/theme/tokens';

export default function BoasVindas() {
  const router = useRouter();
  const { nova } = useLocalSearchParams<{ nova?: string }>();
  const { consentimento, selecionar, recarregar } = useApp();
  const adicionando = nova === '1' && !!consentimento;
  const [salvando, setSalvando] = useState(false);
  const [apelido, setApelido] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [prematuro, setPrematuro] = useState(false);
  const [semanas, setSemanas] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  async function continuar() {
    const nome = apelido.trim();
    const data = lerData(nascimento);
    const sem = prematuro ? Number(semanas) : null;
    if (!nome) return setErro('Conte como a criança é chamada.');
    if (!data) return setErro('Confira a data de nascimento (DD/MM/AAAA).');
    if (prematuro && (!sem || sem < 22 || sem >= 37)) return setErro('Informe as semanas de gestação (entre 22 e 36).');
    if (!faixaPara(idadeParaTriagem(data, new Date(), sem))) return setErro('O app é para crianças de 0 a 6 anos.');
    setErro(null);
    const iso = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
    if (!adicionando) {
      router.push({ pathname: '/consentimento', params: { apelido: nome, nascimento: iso, semanas: sem ? String(sem) : '' } });
      return;
    }
    // termo já aceito: a nova criança vai direto para a triagem
    setSalvando(true);
    try {
      const id = novoId();
      await repositorio.salvarCrianca({ id, apelido: nome, nascimento: iso, semanasGestacao: sem, criadaEm: new Date().toISOString() });
      selecionar(id);
      await recarregar();
      irPara(router, '/triagem');
    } catch (e) {
      console.error('[boas-vindas] falha ao salvar criança', e);
      setErro('Não conseguimos salvar. Tente de novo.');
      setSalvando(false);
    }
  }

  return (
    <Tela
      topo={adicionando ? <BotaoVoltar onPress={() => (router.canGoBack() ? router.back() : router.replace('/perfil'))} /> : undefined}
      rodape={<Botao titulo={adicionando ? 'Adicionar e fazer a triagem' : 'Começar gratuitamente'} onPress={continuar} carregando={salvando} icone={<SetaDireita />} />}
    >
      {adicionando ? null : <Marca />}
      <View style={{ borderRadius: 28, overflow: 'hidden', backgroundColor: cores.ilustracao }}>
        <Image source={ILUSTRACOES.ler} style={{ width: '100%', aspectRatio: 320 / 234 }} resizeMode="cover" accessibilityLabel="Mãe lendo um livro com o filho" />
      </View>
      <View style={{ gap: 10 }}>
        {adicionando ? (
          <Texto variante="titulo">Quem mais vamos acompanhar?</Texto>
        ) : (
          <Texto variante="titulo">
            Acompanhe cada <Texto variante="titulo" style={{ color: cores.marca }}>conquista</Texto> do seu filho.
          </Texto>
        )}
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

