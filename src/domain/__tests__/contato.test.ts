import { codigoContato, linkWhatsApp, resumoTriagem } from '@/domain/contato';

it('codigoContato é estável e no formato CONECTA-XXXX', () => {
  const c = codigoContato('abc-123');
  expect(c).toMatch(/^CONECTA-[A-Z2-9]{4}$/);
  expect(codigoContato('abc-123')).toBe(c);
  expect(codigoContato('abc-124')).not.toBe(c);
});

it('linkWhatsApp não leva dado de saúde e inclui o código', () => {
  const url = linkWhatsApp('avaliar', '1 ano e 7 meses', 'CONECTA-AB12', '+55 (62) 99999-0000');
  expect(url.startsWith('https://wa.me/5562999990000?text=')).toBe(true);
  const texto = decodeURIComponent(url.split('text=')[1]);
  expect(texto).toContain('CONECTA-AB12');
  expect(texto).toContain('agendar uma avaliação');
  expect(texto).not.toMatch(/fala|imitação|ainda não/i);
});

test('sem número no build, usa o WhatsApp da clínica', () => {
  const antes = process.env.EXPO_PUBLIC_WHATSAPP_CLINICA;
  delete process.env.EXPO_PUBLIC_WHATSAPP_CLINICA;
  const { linkWhatsApp, WHATSAPP_CLINICA_PADRAO } = jest.requireActual('../contato');
  expect(linkWhatsApp('avaliar', '3 anos', 'CONECTA-AAAA').startsWith(`https://wa.me/${WHATSAPP_CLINICA_PADRAO}?text=`)).toBe(true);
  process.env.EXPO_PUBLIC_WHATSAPP_CLINICA = antes;
});

test('resumo da triagem é neutro e só entra na mensagem quando os pais escolhem', () => {
  const resumo = resumoTriagem(['Fala', 'Compreensão'], 6, 8);
  expect(resumo).toBe('Resumo da triagem: 6 de 8 habilidades no esperado. Ainda em desenvolvimento: fala e compreensão.');
  expect(resumo).not.toMatch(/atraso|laudo|diagn/i);
  expect(resumoTriagem([], 8, 8)).toBe('Resumo da triagem: 8 de 8 habilidades no esperado.');

  const sem = decodeURIComponent(linkWhatsApp('observar', '3 anos', 'CONECTA-AAAA'));
  expect(sem).not.toContain('Resumo da triagem');
  const com = decodeURIComponent(linkWhatsApp('observar', '3 anos', 'CONECTA-AAAA', undefined, resumo));
  expect(com).toContain('CONECTA-AAAA');
  expect(com).toContain('Ainda em desenvolvimento: fala e compreensão.');
});
