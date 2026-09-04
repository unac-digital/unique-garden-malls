# Vídeo de fundo no hero — instruções de aplicação

Documento escrito em 29/08/2026 por Claude (Opus 5), a partir da implementação real feita no site da **Império Corretora** (`unac-digital/corretoraimperio`). Lá o recurso foi construído, testado, publicado e depois revertido a pedido do cliente — o vídeo passou a ser destinado a este projeto.

Tudo aqui foi verificado na prática, não é receita teórica. Os pontos onde este site **difere** da Império estão marcados, porque copiar a solução sem adaptar vai quebrar coisas.

---

## 1. O que se quer

Vídeo institucional rodando em loop atrás do conteúdo do hero, com véu por cima para o texto continuar legível. Sem som, sem controles, decorativo.

---

## 2. Arquivo de origem

O vídeo **já está comprimido e pronto**:

```
C:\Users\GIOVANNI\OneDrive\Empresas\UNAC DIGITAL\clientes\grupo Império\império corretora\documentos - corretora Império\vídeo\video-comprimido-720p-15s.mp4
```

Especificações confirmadas por `ffprobe`:

| Propriedade | Valor |
|---|---|
| Resolução | 1280×720 |
| Duração | 15,000 s |
| Codec | H.264 High, level 3.1, yuv420p |
| Taxa | 1,02 Mbps |
| Tamanho | 1.914.552 bytes (1,9 MB) |
| Faixas de áudio | **0** (removidas do arquivo, não apenas mudas) |
| faststart | sim (`moov` no offset 36, antes do `mdat`) |

O original de 220 MB está na mesma pasta (`Imperio_video.mp4`), caso seja preciso outro trecho ou outra duração.

### Se precisar reprocessar

```bash
ffmpeg -i "Imperio_video.mp4" -t 15 -vf "scale=1280:720" -c:v libx264 -profile:v high -crf 32 -preset slow -pix_fmt yuv420p -an -movflags +faststart "saida.mp4"
```

`-an` remove o áudio, `-t 15` corta nos 15s, `-movflags +faststart` põe o índice no início para o vídeo começar a tocar antes de baixar inteiro. Confira o resultado com `ffprobe` antes de usar.

> **Atenção ao conteúdo:** o vídeo é da **Império Corretora**. Confirme com o Giovanni que ele faz sentido para o Unique Garden Malls antes de aplicar. Isso não é decisão de quem implementa.

---

## 3. Diferenças deste site em relação à Império — leia antes de codar

Levantei a estrutura da `v3` deste site. Ela **não** é igual à da Império.

### 3.1 Existe tema claro alternável — este é o ponto mais importante

`v3/style.css:1527` define `[data-theme="light"] .hero`, e `v3/script.js:127` tem o botão que alterna. No tema claro a paleta inverte:

| Token | Tema escuro | Tema claro |
|---|---|---|
| `--color-bg` | `#1E3524` (verde escuro) | `#F6F0DC` (creme) |
| `--color-text` | `#F4EFDD` (claro) | `#1E3524` (escuro) |
| `--color-heading` | `#FFFFFF` | `#1E3524` |

Na Império o texto era **sempre** branco sobre fundo escuro, então bastou um véu escuro. **Aqui não.** No tema claro o texto é verde escuro sobre creme: um véu escuro deixaria esse texto ilegível.

O véu precisa ser **duplo**: escuro no tema escuro, claro no tema claro. Está previsto no CSS da seção 5.

### 3.2 O `.hero` já tem gradiente próprio

```css
.hero {
  background:
    linear-gradient(180deg, rgba(23,40,27,0.55) 0%, rgba(23,40,27,0.88) 100%),
    var(--color-bg);
}
```

Esse gradiente é pintado **no fundo do elemento**, ou seja, atrás dos filhos. Assim que o vídeo entrar como filho posicionado cobrindo o hero, ele tapa esse gradiente por completo. **O véu novo precisa reproduzir esse degradê**, senão o visual muda mesmo com o vídeo pausado.

### 3.3 Os enfeites aqui são elementos reais, não pseudo-elementos

Na Império, `::before` e `::after` do `.hero` estavam ocupados pelos brilhos dourados — por isso lá criei uma `<div>` para o véu.

Aqui os brilhos são `<span class="hero__decor">` (`index.html:158-159`), então `.hero::before` e `.hero::after` **estão livres**. Ainda assim, prefira uma `<div class="hero__overlay">`: fica explícito no HTML e é mais fácil de alguém entender depois.

### 3.4 Camadas (z-index) já em uso

| Elemento | z-index | Observação |
|---|---|---|
| `.hero__decor` | `0` | brilhos; vêm antes no DOM |
| `.hero__inner` | `1` | o conteúdo, já acima |

O vídeo e o véu entram em `z-index: 0`, **antes** dos `.hero__decor` no HTML. Assim os brilhos continuam por cima do vídeo e o conteúdo por cima de tudo. Não mexa no `z-index: 1` do `.hero__inner`.

### 3.5 Há uma imagem LCP no hero disputando banda

`index.html:171` tem a imagem do hero com `fetchpriority="high"` e `loading="eager"` — é o elemento LCP da página.

A Império **não tinha** imagem no hero; lá o `preload="auto"` do vídeo não disputava com nada. Aqui vai disputar.

O histórico deste repositório mostra que isso é sensível: o commit `eebacb2` **reverteu** uma otimização de fontes justamente porque *"não trouxe ganho e piorava o Speed Index"*. Já houve regressão de performance aqui antes.

**Portanto:** comece com `preload="metadata"` (não `auto`), meça o LCP antes e depois, e leve os números ao Giovanni. Se o LCP piorar, a decisão de manter ou não o vídeo é dele, não sua.

---

## 4. HTML

Em `v3/index.html`, dentro de `<section class="hero">`, **antes** dos `<span class="hero__decor">`:

```html
<!-- Vídeo decorativo de fundo. Sem poster de propósito: se o navegador
     não carregar ou bloquear o autoplay (modo economia de dados), o que
     aparece é o fundo do .hero — exatamente o site sem vídeo.
     aria-hidden + tabindex="-1": é enfeite, não entra na leitura de tela
     nem recebe foco pelo teclado. -->
<video class="hero__video" autoplay muted loop playsinline
       preload="metadata" aria-hidden="true" tabindex="-1">
  <source src="assets/video/hero.mp4" type="video/mp4">
</video>
<div class="hero__overlay" aria-hidden="true"></div>
```

Cada atributo tem função — não remova nenhum:

- `muted` — **sem ele o autoplay é bloqueado** em todos os navegadores modernos.
- `playsinline` — sem ele o iOS abre o vídeo em tela cheia.
- `loop` — repete.
- `aria-hidden="true"` + `tabindex="-1"` — mantém fora de leitores de tela e da navegação por teclado.
- Sem `poster`, de propósito: a reserva é o próprio fundo do hero.

Copie o arquivo para `v3/assets/video/hero.mp4` (crie a pasta) e ajuste o caminho se a convenção de assets do projeto for outra.

---

## 5. CSS

Em `v3/style.css`, logo após a regra `.hero { ... }` (por volta da linha 427):

```css
/* ── Vídeo de fundo do hero ─────────────────────────────── */
.hero__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* cover recorta o excesso em vez de esticar: o vídeo é 16:9 e o hero
     muda de proporção conforme a tela. */
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
}

/* O vídeo tapa o gradiente que o .hero pinta no próprio background, então
   o véu precisa reproduzi-lo — um pouco mais denso, porque imagem em
   movimento atrapalha a leitura mais do que cor chapada. */
.hero__overlay {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(180deg,
    rgba(23, 40, 27, 0.72) 0%,
    rgba(23, 40, 27, 0.93) 100%);
}

/* Tema claro: aqui o texto é verde escuro sobre creme. Um véu escuro o
   tornaria ilegível — o véu inverte junto com a paleta. */
[data-theme="light"] .hero__overlay {
  background: linear-gradient(180deg,
    rgba(246, 240, 220, 0.55) 0%,
    rgba(237, 228, 200, 0.92) 100%);
}

/* Quem pediu menos movimento no sistema não vê o vídeo: sobra o fundo do
   .hero, idêntico ao site sem vídeo. O véu sai junto — sozinho ele
   escureceria o fundo e mudaria a aparência original. */
@media (prefers-reduced-motion: reduce) {
  .hero__video,
  .hero__overlay { display: none; }
}
```

> Os valores de opacidade (`0.72`, `0.93`, `0.55`, `0.92`) são **ponto de partida**, não resultado. A seção 8.2 explica como medir e ajustar.

### 5.1 Cards e caixas sobre o vídeo — a armadilha que mais custou tempo

Na Império os cards do hero usavam `rgba(255,255,255,0.06)` — um filme branco de 6%. Sobre cor chapada aquilo funcionava como leve relevo; sobre **imagem em movimento** o card simplesmente deixava de existir: o vídeo atravessava e a borda se dissolvia.

E não era só estética. Medindo a luminância real do vídeo na faixa dos cards, havia quadros com pixels em **255** (branco puro). Ali o texto de apoio ficava em **2,77:1** — *abaixo do mínimo legível de 4,5:1*.

A correção foi dar base escura própria ao card e desfocar o que passa atrás (efeito vidro fosco), o que levou o contraste a **7,49:1** (nível AAA):

```css
@media (prefers-reduced-motion: no-preference) {
  .SEU-CARD {
    background: rgba(23, 40, 27, 0.58);   /* use a cor de fundo DESTE site */
    border-color: rgba(244, 239, 221, 0.18);
    -webkit-backdrop-filter: blur(10px) saturate(115%);
    backdrop-filter: blur(10px) saturate(115%);
  }
}
```

O `@media (prefers-reduced-motion: no-preference)` é proposital: esse reforço só faz sentido **quando existe vídeo**. Sem ele, o card volta ao original sozinho.

**Aqui:** o hero tem `.hero__media` com uma imagem opaca, que não sofre desse problema. Verifique se `.hero__cta`, `.hero__eyebrow` ou botões translúcidos precisam do mesmo tratamento. **Meça antes de decidir** (seção 8.2).

---

## 6. JavaScript

Em `v3/script.js`. O CSS já esconde o vídeo no modo "reduzir movimento", mas escondido ele **ainda baixaria os 1,9 MB**. Isto evita o download:

```js
/* ─── Vídeo de fundo do hero ──────────────────────────── */
(function () {
  var video = document.querySelector('.hero__video');
  if (!video) return;
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  video.pause();
  video.removeAttribute('autoplay');
  Array.prototype.forEach.call(video.querySelectorAll('source'), function (s) {
    s.remove();
  });
  video.load();   // sem o load() o navegador mantém a fonte anterior
})();
```

Este arquivo usa `var` e `Array.prototype.forEach.call` — mantive o estilo. Confira o padrão do arquivo antes de colar.

---

## 7. Armadilhas verificadas — todas me pegaram de verdade

### 7.1 Cache do navegador mascara o resultado (pega duas vezes)

Editei o CSS, recarreguei, **nada mudou** — o navegador servia a versão antiga. Fiquei um tempo achando que a regra estava errada.

Depois, ao reverter, o navegador me devolveu HTML e CSS antigos mesmo com o servidor já limpo, e quase relatei "não reverteu" antes de checar direito.

**Sempre valide com `curl` ou `fetch(..., {cache:'no-store'})`, não com F5.** Para ver no navegador, use `Ctrl+Shift+R` ou uma query (`style.css?v=123`).

### 7.2 `getComputedStyle` devolve `background` e `border-color` velhos

Depois de trocar a folha de estilo em tempo de execução, o `getComputedStyle` continuou reportando o `background` e o `border-color` antigos, **enquanto outras propriedades da mesma regra já mostravam o valor novo** (`backdrop-filter` e `color` atualizaram, `background` não).

Isso me levou a conclusões erradas duas vezes. **Screenshot e `fetch` do arquivo são a verdade; `getComputedStyle` após troca de folha, não.**

### 7.3 Vídeo pausa em aba de fundo

`document.visibilityState === 'hidden'` faz o navegador pausar o vídeo. Ao testar de forma automatizada, `paused: true` pode ser artefato do teste, não defeito do site. Cheque `visibilityState` antes de concluir qualquer coisa.

### 7.4 Reescrever arquivo em Python troca LF por CRLF

Reescrevi o `style.css` com Python e o diff acusou **2.325 linhas alteradas** em vez de 20 — o arquivo era LF e virou CRLF. Um commit assim destrói o histórico do arquivo.

Confira com `diff --strip-trailing-cr` ou `git diff --stat` antes de commitar. Para converter de volta: leia e escreva em **binário**, `d.replace(b'\r\n', b'\n')`.

### 7.5 O loop tem um salto visível

Aos 15s a imagem volta ao início de forma perceptível — é inerente a repetir uma filmagem que não foi feita para loop. O véu suaviza, não elimina.

Se incomodar, as saídas são: escolher um trecho cujo início e fim se pareçam, ou tocar em ida-e-volta (perfeitamente contínuo, mas movimento invertido fica estranho se houver pessoas ou carros em cena).

---

## 8. Verificação — não entregue sem isto

### 8.1 O vídeo está mesmo tocando

```js
const v = document.querySelector('.hero__video');
const t1 = v.currentTime;
await new Promise(r => setTimeout(r, 2000));
({ avancou: v.currentTime - t1, visibilidade: document.visibilityState,
   mudo: v.muted, loop: v.loop, resolucao: v.videoWidth + 'x' + v.videoHeight,
   erro: v.error && v.error.code, readyState: v.readyState })
```

`avancou > 0` prova reprodução. Se for `0`, confira `visibilidade` **antes** de concluir que há defeito (7.3).

### 8.2 Contraste no pior quadro — o que evita entregar texto ilegível

Não confie no olho: amostre a luminância real do vídeo e ache o quadro mais claro na faixa onde fica o texto.

```js
const v = document.querySelector('.hero__video');
const cv = document.createElement('canvas'); cv.width = 160; cv.height = 90;
const ctx = cv.getContext('2d', { willReadFrequently: true });
const amostra = t => new Promise(res => {
  v.addEventListener('seeked', () => {
    ctx.drawImage(v, 0, 0, 160, 90);
    const d = ctx.getImageData(0, 0, 160, 90).data;   // recorte a faixa do texto
    let max = 0;
    for (let i = 0; i < d.length; i += 4)
      max = Math.max(max, 0.2126*d[i] + 0.7152*d[i+1] + 0.0722*d[i+2]);
    res({ t, maxL: +max.toFixed(1) });
  }, { once: true });
  v.currentTime = t;
});
v.pause();
const out = []; for (let t = 0; t < 15; t += 1.5) out.push(await amostra(t));
out.sort((a, b) => b.maxL - a.maxL)[0];   // pior quadro
```

Depois componha vídeo → véu → (card, se houver) e calcule o contraste:

```js
const lum = c => { c /= 255; return c <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
const razao = (a, b) => (Math.max(a,b) + 0.05) / (Math.min(a,b) + 0.05);
const sobre = (topo, alfa, base) => topo*alfa + base*(1-alfa);
```

**Mínimos:** 4,5:1 para texto normal, 3:1 para texto grande, 7:1 para AAA. Se não passar, aumente a opacidade do véu e meça de novo.

**Faça isso nos dois temas** — claro e escuro. O tema claro é o mais arriscado, porque o texto escuro precisa que o véu seja *claro* o bastante.

### 8.3 Reserva e acessibilidade

- Bloqueie o vídeo (DevTools → Network → bloquear `.mp4`) e confirme que o hero continua apresentável.
- Ative "reduzir movimento" no sistema e confirme: vídeo some, véu some, **e o arquivo não é baixado** (aba Network sem o `.mp4`).
- Alterne o tema com o vídeo rodando e confira o contraste nos dois.

### 8.4 Performance (por causa do 3.5)

Meça LCP **antes e depois** (Lighthouse ou `PerformanceObserver`). Leve os dois números ao Giovanni. Não decida sozinho manter uma regressão.

### 8.5 Mobile

Teste em 375px de largura. Confirme que não há barra de rolagem horizontal e que o `object-fit: cover` não corta a parte importante da cena.

---

## 9. Estado do repositório — cuidado antes de começar

Em 29/08/2026 este repositório tinha **alterações não commitadas**:

```
 M v3/index.html
 M v3/script.js
 M v3/style.css
```

Não sei do que se trata nem de quando são. **Não commite junto com o vídeo.** Rode `git status` e `git diff`, entenda o que é, e pergunte ao Giovanni antes de misturar.

Branch de trabalho: `dev`. Remoto: `unac-digital/unique-garden-malls`. As versões `v1/` e `v2/` são históricas — o trabalho atual é na **`v3/`**; confirme antes de aplicar.

---

## 10. Resumo do que perguntar ao Giovanni

1. O vídeo é da Império — serve mesmo para o Unique Garden Malls? (seção 2)
2. Se o LCP piorar, mantém o vídeo? (seções 3.5 e 8.4)
3. O que são as três alterações pendentes na v3? (seção 9)
4. O salto no loop dos 15s é aceitável? (seção 7.5)
