import { contarBackup, lerBackup, mesclar, montarBackup, nomeArquivoBackup } from '@/domain/backup';

const conteudo = {
  criancas: [{ id: 'k1', apelido: 'Bia', nascimento: '2025-08-10', semanasGestacao: null, criadaEm: '2026-10-01T10:00:00Z' }],
  triagens: [],
  conclusoes: [{ id: 'c1', criancaId: 'k1', missaoId: 'm01-caca-tesouros', como: 'facil' as const, em: '2026-10-30T10:00:00Z' }],
  diario: [{ id: 'd1', criancaId: 'k1', data: '2026-10-31', contexto: 'casa' as const, humor: 'bom' as const, areas: [], conquista: false, nota: 'oi', criadoEm: '2026-10-31T10:00:00Z', editadoEm: '2026-10-31T10:00:00Z' }],
};

describe('cópia dos dados', () => {
  it('ida e volta: o que exporta, lê', () => {
    const texto = JSON.stringify(montarBackup(conteudo, new Date(2026, 9, 31)));
    const r = lerBackup(texto);
    expect(r.ok).toBe(true);
    expect(r.ok && contarBackup(r.backup)).toEqual({ criancas: 1, triagens: 0, missoes: 1, diario: 1 });
  });

  it('recusa arquivo que não é do app, versão futura ou incompleto', () => {
    expect(lerBackup('{oops')).toEqual({ ok: false, erro: 'json' });
    expect(lerBackup(JSON.stringify({ formato: 'outro' }))).toEqual({ ok: false, erro: 'formato' });
    expect(lerBackup(JSON.stringify({ ...montarBackup(conteudo), versao: 99 }))).toEqual({ ok: false, erro: 'versao' });
    expect(lerBackup(JSON.stringify({ ...montarBackup(conteudo), diario: [{ nota: 'sem id' }] }))).toEqual({ ok: false, erro: 'conteudo' });
    expect(lerBackup(JSON.stringify({ ...montarBackup(conteudo), criancas: [{ id: 'k1' }] }))).toEqual({ ok: false, erro: 'conteudo' });
  });

  it('mesclar não duplica e não sobrescreve o que já está no celular', () => {
    const atual = [{ id: 'a', v: 1 }];
    expect(mesclar(atual, [{ id: 'a', v: 2 }, { id: 'b', v: 3 }])).toEqual([{ id: 'a', v: 1 }, { id: 'b', v: 3 }]);
  });

  it('nome do arquivo com a data', () => {
    expect(nomeArquivoBackup(new Date(2026, 9, 31))).toBe('conecta-copia-2026-10-31.json');
  });
});
