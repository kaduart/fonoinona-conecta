import { codigoContato, linkWhatsApp } from '@/domain/contato';

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
