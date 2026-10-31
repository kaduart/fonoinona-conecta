import { cifrar, decifrar, estaCifrado } from '@/storage/cifra';

const chave = crypto.getRandomValues(new Uint8Array(32));
const nonce = () => crypto.getRandomValues(new Uint8Array(24));

describe('cifra', () => {
  it('ida e volta preserva o texto, inclusive acentos', () => {
    const texto = JSON.stringify([{ apelido: 'Pedrinho', nota: 'Às vezes não fala "mamãe"' }]);
    const c = cifrar(chave, texto, nonce());
    expect(estaCifrado(c)).toBe(true);
    expect(c).not.toContain('Pedrinho');
    expect(decifrar(chave, c)).toBe(texto);
  });

  it('cada gravação gera um valor diferente', () => {
    expect(cifrar(chave, 'a', nonce())).not.toBe(cifrar(chave, 'a', nonce()));
  });

  it('recusa chave errada', () => {
    const c = cifrar(chave, 'segredo', nonce());
    expect(() => decifrar(crypto.getRandomValues(new Uint8Array(32)), c)).toThrow();
  });

  it('recusa conteúdo adulterado', () => {
    const c = cifrar(chave, 'segredo', nonce());
    const ultimo = c.at(-1) === '0' ? '1' : '0';
    expect(() => decifrar(chave, c.slice(0, -1) + ultimo)).toThrow();
  });

  it('valor antigo em texto puro não é tratado como cifrado', () => {
    expect(estaCifrado('[{"id":"1"}]')).toBe(false);
  });
});
