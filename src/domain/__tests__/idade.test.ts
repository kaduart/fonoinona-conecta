import { formatarIdade, idadeParaTriagem, lerData, mascararData, mesesEntre } from '@/domain/idade';

describe('mesesEntre', () => {
  it('conta só meses completos', () => {
    expect(mesesEntre(new Date(2025, 2, 12), new Date(2026, 9, 11))).toBe(18);
    expect(mesesEntre(new Date(2025, 2, 12), new Date(2026, 9, 12))).toBe(19);
  });
});

describe('idadeParaTriagem', () => {
  const hoje = new Date(2026, 9, 31);
  it('usa idade cronológica para quem nasceu a termo', () => {
    expect(idadeParaTriagem(new Date(2025, 9, 31), hoje, 39)).toBe(12);
  });
  it('corrige a idade de prematuros até 2 anos', () => {
    // 32 semanas: 8 semanas (56 dias) a menos
    expect(idadeParaTriagem(new Date(2025, 9, 31), hoje, 32)).toBe(10);
  });
  it('não corrige depois dos 2 anos', () => {
    expect(idadeParaTriagem(new Date(2023, 9, 31), hoje, 30)).toBe(36);
  });
});

describe('formatarIdade', () => {
  it.each([
    [1, '1 mês'],
    [8, '8 meses'],
    [12, '1 ano'],
    [19, '1 ano e 7 meses'],
    [37, '3 anos e 1 mês'],
  ])('%i meses → %s', (m, t) => expect(formatarIdade(m)).toBe(t));
});

describe('lerData', () => {
  const hoje = new Date(2026, 9, 31);
  it('aceita data válida', () => expect(lerData('12/03/2025', hoje)).toEqual(new Date(2025, 2, 12)));
  it('recusa data impossível', () => expect(lerData('31/02/2025', hoje)).toBeNull());
  it('recusa data no futuro', () => expect(lerData('01/01/2027', hoje)).toBeNull());
  it('recusa formato errado', () => expect(lerData('2025-03-12', hoje)).toBeNull());
});

it('mascararData formata enquanto digita', () => {
  expect(mascararData('1203')).toBe('12/03');
  expect(mascararData('12032025')).toBe('12/03/2025');
  expect(mascararData('12/03/20259')).toBe('12/03/2025');
});
