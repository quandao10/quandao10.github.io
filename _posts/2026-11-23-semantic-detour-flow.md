---
layout: post
title: "Semantic Detour Flow"
date: 2026-11-23
description: Pixel diffusion that decides semantics first — a flow that follows frozen DINOv2 features at high noise and hands over to pixels at low noise.
tags: diffusion flow-matching pixel-space generative-models
categories: research
giscus_comments: false
related_posts: false
toc:
  sidebar: left
_styles: >
  .detour-grid {
    column-count: 4;
    column-gap: 10px;
    margin: 1.5rem 0;
  }
  @media (max-width: 900px) { .detour-grid { column-count: 3; } }
  @media (max-width: 600px) { .detour-grid { column-count: 2; } }
  .detour-grid img {
    width: 100%;
    margin: 0 0 10px;
    border-radius: 6px;
    display: block;
    break-inside: avoid;
    cursor: zoom-in;
    transition: transform .18s ease, box-shadow .18s ease;
  }
  .detour-grid img:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0,0,0,.18);
  }
  .detour-fig { margin: 1.8rem 0; }
  .detour-fig img { width: 100%; height: auto; display: block; border-radius: 4px; cursor: zoom-in; }
  .detour-fig figcaption {
    font-size: .88rem;
    opacity: .72;
    margin-top: .5rem;
    text-align: left;
  }
  .detour-video { width: 100%; margin: 1.8rem 0; }
  .detour-video video {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 4px;
    background: #faf9f7;
  }
  .detour-num {
    display: flex;
    flex-wrap: wrap;
    gap: 1.6rem;
    margin: 1.6rem 0;
  }
  .detour-num div { min-width: 0; }
  .detour-num .v { font-size: 1.9rem; font-weight: 600; line-height: 1.1; }
  .detour-num .k { font-size: .82rem; text-transform: uppercase; letter-spacing: .06em; opacity: .68; }
  table.detour td, table.detour th { padding: .35rem .6rem; }
  .detour-authors {
    margin: 0 0 1.8rem;
    padding-bottom: 1.2rem;
    border-bottom: 1px solid rgba(128,128,128,.22);
  }
  .detour-authors .names {
    font-size: 1.05rem;
    line-height: 1.75;
  }
  .detour-authors .names sup { font-size: .72em; opacity: .75; padding-left: .1em; }
  .detour-authors .affil {
    font-size: .88rem;
    opacity: .72;
    margin-top: .5rem;
    line-height: 1.6;
  }
  .detour-authors .affil sup { padding-right: .15em; }
  .in-grid {
    display: grid;
    gap: 12px;
    margin: 1.4rem 0 2rem;
  }
  .in-grid-256 { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
  .in-grid-512 { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
  .in-grid figure { margin: 0; }
  .in-grid img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 5px;
    cursor: zoom-in;
    image-rendering: auto;
  }
  .in-grid figcaption {
    font-size: .76rem;
    opacity: .66;
    margin-top: .3rem;
    text-align: center;
    line-height: 1.3;
  }
---

<div class="detour-authors">
  <div class="names">
    Quan Dao<sup>1</sup>,
    Tuan Pham<sup>2</sup>,
    Anh Nguyen<sup>3</sup>,
    Duc Vu<sup>1</sup>,
    Quyen Tran<sup>1</sup>,
    Stephan Mandt<sup>2</sup>,
    Dimitris Metaxas<sup>1</sup>
  </div>
  <div class="affil">
    <sup>1</sup>Rutgers University &nbsp;·&nbsp;
    <sup>2</sup>UC Irvine &nbsp;·&nbsp;
    <sup>3</sup>Johns Hopkins University
  </div>
</div>

Diffusion models trained in semantic latent spaces converge much faster than pixel-space
models, but they inherit a decoder that caps fine detail. **Semantic Detour Flow** closes most
of that gap without any decoder: it is a pixel-space flow that follows frozen DINOv2 features
at high noise and hands over to pixels at low noise. One network, one velocity loss, and
sampling that runs entirely in pixel space.

<div class="detour-num">
  <div><div class="v">92.8 → 38.8</div><div class="k">FID-10k, 20 epochs, same network</div></div>
  <div><div class="v">1.35</div><div class="k">FID-50k, ImageNet 256</div></div>
  <div><div class="v">1.35</div><div class="k">FID-50k, ImageNet 512</div></div>
  <div><div class="v">0.90 / 87.8</div><div class="k">GenEval / DPG-Bench, 512</div></div>
</div>

<figure class="detour-fig">
  <img src="{{ '/assets/img/detour/teaser.jpg' | relative_url }}" data-zoomable data-zoom-src="{{ '/assets/img/detour/full/teaser.jpg' | relative_url }}" alt="Samples from Semantic Detour Flow" />
</figure>

## Why pixel diffusion is slow

The gap is in the denoising target at high noise. When almost everything is noise, the best a
model can do is predict the posterior mean of the target given the noisy state. For pixels,
that posterior mean is a blur — an average over everything the image could have been. For
self-supervised features it is a *semantic prototype*: a representation that still says what
the thing is.

So a pixel model spends its early training budget learning to produce blur, while a latent
model spends the same budget learning content. That is the asymmetry, and it is the one thing
worth fixing.

## The detour

Let $$c(x)$$ be the frozen DINOv2-B features of $$x$$ on the 16×16 patch grid, centred and scaled to
standard deviation 0.5 — the scale of the image itself, so neither term dominates. We call it
the **code**. Let $$\Phi$$ be the pixel shuffle that maps each 768-dimensional token into the
3×16×16 pixels of its patch, so $$\Phi c(x)$$ is image-shaped and aligned with $$x$$.

The noisy state mixes the image and the code, then adds noise:

$$
z_t = t\,m_t + (1-t)\,\varepsilon, \qquad m_t = \alpha_t\,x + \beta_t\,\Phi c(x).
$$

The weights hand the signal over from the code at $$t=0$$ to the image at $$t=1$$. We use a
trigonometric hand-over with a mid-path norm bump:

$$
(\alpha_t, \beta_t) = g_t\,(\sin\theta_t,\, \cos\theta_t), \qquad
\theta_t = \tfrac{\pi t}{2}, \qquad
g_t = 1 + \kappa \sin 2\theta_t,
$$

with $$\kappa = 0.25$$. Plain pixel flow is the special case $$\alpha \equiv 1$$, $$\beta \equiv 0$$.
Differentiating gives the target velocity, and a single network is trained against it with one
unified loss — predicting pixels and code together.

DINOv2-B's 768 channels are exactly one 16×16×3 patch, so $$\Phi$$ is an isometry onto the image.
That coincidence is convenient, not essential; other encoders and code widths work too.

### Watch the hand-over

The video runs the equation above continuously in $$t$$, on a real image with its real code
(shown by its first three principal components). On the left is the signal $$m_t$$ the path points
at; on the right the state $$z_t$$ the network actually sees. Near noise the signal is a semantic
prototype; near data it is the photograph.

<div class="detour-video">
  <video controls playsinline autoplay loop muted preload="metadata" poster="{{ '/assets/img/detour/video_poster.jpg' | relative_url }}">
    <source src="{{ '/assets/video/detour_path.mp4' | relative_url }}" type="video/mp4" />
    Your browser does not support the video tag.
  </video>
</div>

<figure class="detour-fig">
  <img src="{{ '/assets/img/detour/system.jpg' | relative_url }}" data-zoomable data-zoom-src="{{ '/assets/img/detour/full/system.jpg' | relative_url }}" alt="The detour path and the network" />
  <figcaption>Left: the signal \(m_t\) and the state \(z_t\) on a real image, with the code shown by its PCA colours. Right: the network predicts image and code.</figcaption>
</figure>

Sampling needs none of this machinery. It integrates a pixel-space ODE from noise to data —
no encoder, no decoder, nothing to reconstruct through.

## Does the detour actually speed things up?

Each row adds one piece to plain pixel flow, using the *same* network (JiT-B, 296M, unguided FID,
Heun 50 steps). Putting DINOv2 features into the path is by far the largest single gain.

| Model | FID-10k, 20 ep. | Δ | FID-50k, 80 ep. |
|---|---|---|---|
| Pixel flow (JiT, same network) | 92.8 | — | 48.3 |
| + detour path | 66.6 | −26.2 | — |
| + trigonometric mix | 52.7 | −13.9 | — |
| + norm bump | 49.1 | −3.6 | — |
| + fitted logit-normal $$t$$ | 47.9 | −1.2 | 23.4 |
| + interval sampling | 45.5 | −2.4 | 20.4 |
| + multi-layer code | **38.8** | −6.7 | **15.8** |
{: .detour}

Semantic latent diffusion still converges faster, but the detour recovers much of the advantage
while generating directly in pixels.

## ImageNet

At 256×256, Detour-XL/16 reaches **FID-50k 1.43** in 200 epochs; at 512×512, Detour-XL/32 reaches
**1.59** in 160 epochs. Without guidance the same models reach 3.69 and 4.19.

Both runs were continued, and both now reach **1.35**: 256×256 gets **1.35** at epoch 320, and
512×512 gets **1.35** at epoch 280. At 512 most of that came from the guidance *window* rather than
from the extra epochs — the same setting on [0.05, 0.75] measures 1.46 on two separate
runs, and widening to [0.05, 0.9], the value 256 already used, gives 1.35. Epoch 320 at 512 is worse
than 280, so the longer run is not uniformly better.

Guidance matters, and the two kinds compose. Classifier-free guidance alone plateaus; autoguidance
alone is already better at a much lower Inception score; together they are better than either.

| Sampling (Detour-XL/16, epoch 200) | FID-50k | IS |
|---|---|---|
| Unguided | 3.69 | 182 |
| CFG 2.25 on [0.05, 0.9] | 2.27 | 283 |
| AutoGuidance 2.0 | 1.81 | 210 |
| **CFG 1.75 + AutoGuidance 2.0** | **1.43** | 267 |
{: .detour}

The same comparison at epoch 320, and at 512×512 at epoch 280, both on the window [0.05, 0.9]:

| Sampling | FID-50k | IS |
|---|---|---|
| **XL/16 @320** — unguided | 3.24 | 192 |
| CFG 2.5 alone | 2.13 | 300 |
| AutoGuidance 2.0 | 1.59 | 220 |
| **CFG 1.625 + AutoGuidance 2.0** | **1.35** | 267 |
| **XL/32 @280, 512×512** — unguided | 3.73 | 201 |
| CFG 4.0 alone | 2.32 | 334 |
| AutoGuidance 2.0 | 1.54 | 238 |
| **CFG 2.0 + AutoGuidance 2.0** | **1.35** | 297 |
{: .detour}

Note what CFG alone does to the Inception score: it is the *highest* of the four at both resolutions
(300 and 334) while the FID is a full point worse. A large guidance scale buys class-typicality at the
cost of diversity, and FID sees the bill that IS does not.

### 256×256

Detour-XL/16, CFG 1.75 + AutoGuidance 2.0 — the setting that gives FID-50k 1.43.
One sample per class, shown at the model's native 256×256. Click to view at full size.

<div class="in-grid in-grid-256">
  <figure><img src="{{ '/assets/img/detour/in256/009-ostrich.png' | relative_url }}" data-zoomable loading="lazy" alt="ostrich" /><figcaption>ostrich</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/015-robin.png' | relative_url }}" data-zoomable loading="lazy" alt="robin" /><figcaption>robin</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/033-loggerhead.png' | relative_url }}" data-zoomable loading="lazy" alt="loggerhead" /><figcaption>loggerhead</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/088-macaw.png' | relative_url }}" data-zoomable loading="lazy" alt="macaw" /><figcaption>macaw</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/100-black-swan.png' | relative_url }}" data-zoomable loading="lazy" alt="black swan" /><figcaption>black swan</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/108-sea-anemone.png' | relative_url }}" data-zoomable loading="lazy" alt="sea anemone" /><figcaption>sea anemone</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/130-flamingo.png' | relative_url }}" data-zoomable loading="lazy" alt="flamingo" /><figcaption>flamingo</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/207-golden-retriever.png' | relative_url }}" data-zoomable loading="lazy" alt="golden retriever" /><figcaption>golden retriever</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/250-siberian-husky.png' | relative_url }}" data-zoomable loading="lazy" alt="siberian husky" /><figcaption>siberian husky</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/279-arctic-fox.png' | relative_url }}" data-zoomable loading="lazy" alt="arctic fox" /><figcaption>arctic fox</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/291-lion.png' | relative_url }}" data-zoomable loading="lazy" alt="lion" /><figcaption>lion</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/330-wood-rabbit.png' | relative_url }}" data-zoomable loading="lazy" alt="wood rabbit" /><figcaption>wood rabbit</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/360-otter.png' | relative_url }}" data-zoomable loading="lazy" alt="otter" /><figcaption>otter</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/386-african-elephant.png' | relative_url }}" data-zoomable loading="lazy" alt="african elephant" /><figcaption>african elephant</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/387-lesser-panda.png' | relative_url }}" data-zoomable loading="lazy" alt="lesser panda" /><figcaption>lesser panda</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/388-giant-panda.png' | relative_url }}" data-zoomable loading="lazy" alt="giant panda" /><figcaption>giant panda</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/417-balloon.png' | relative_url }}" data-zoomable loading="lazy" alt="balloon" /><figcaption>balloon</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/483-castle.png' | relative_url }}" data-zoomable loading="lazy" alt="castle" /><figcaption>castle</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/510-container-ship.png' | relative_url }}" data-zoomable loading="lazy" alt="container ship" /><figcaption>container ship</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/812-space-shuttle.png' | relative_url }}" data-zoomable loading="lazy" alt="space shuttle" /><figcaption>space shuttle</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/829-streetcar.png' | relative_url }}" data-zoomable loading="lazy" alt="streetcar" /><figcaption>streetcar</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/928-ice-cream.png' | relative_url }}" data-zoomable loading="lazy" alt="ice cream" /><figcaption>ice cream</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/948-granny-smith.png' | relative_url }}" data-zoomable loading="lazy" alt="granny smith" /><figcaption>granny smith</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/949-strawberry.png' | relative_url }}" data-zoomable loading="lazy" alt="strawberry" /><figcaption>strawberry</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/963-pizza.png' | relative_url }}" data-zoomable loading="lazy" alt="pizza" /><figcaption>pizza</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/970-alp.png' | relative_url }}" data-zoomable loading="lazy" alt="alp" /><figcaption>alp</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/975-lakeside.png' | relative_url }}" data-zoomable loading="lazy" alt="lakeside" /><figcaption>lakeside</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in256/980-volcano.png' | relative_url }}" data-zoomable loading="lazy" alt="volcano" /><figcaption>volcano</figcaption></figure>
</div>

### 512×512

Detour-XL/32, CFG 2.5 + AutoGuidance 2.0, at the native 512×512.

<div class="in-grid in-grid-512">
  <figure><img src="{{ '/assets/img/detour/in512/00-001-goldfish.png' | relative_url }}" data-zoomable loading="lazy" alt="goldfish" /><figcaption>goldfish</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in512/01-022-bald-eagle.png' | relative_url }}" data-zoomable loading="lazy" alt="bald eagle" /><figcaption>bald eagle</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in512/02-145-king-penguin.png' | relative_url }}" data-zoomable loading="lazy" alt="king penguin" /><figcaption>king penguin</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in512/03-292-tiger.png' | relative_url }}" data-zoomable loading="lazy" alt="tiger" /><figcaption>tiger</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in512/04-323-monarch.png' | relative_url }}" data-zoomable loading="lazy" alt="monarch" /><figcaption>monarch</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in512/05-089-sulphur-crested-cockatoo.png' | relative_url }}" data-zoomable loading="lazy" alt="sulphur crested cockatoo" /><figcaption>sulphur crested cockatoo</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in512/06-296-ice-bear.png' | relative_url }}" data-zoomable loading="lazy" alt="ice bear" /><figcaption>ice bear</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in512/07-340-zebra.png' | relative_url }}" data-zoomable loading="lazy" alt="zebra" /><figcaption>zebra</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in512/08-107-jellyfish.png' | relative_url }}" data-zoomable loading="lazy" alt="jellyfish" /><figcaption>jellyfish</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in512/09-973-coral-reef.png' | relative_url }}" data-zoomable loading="lazy" alt="coral reef" /><figcaption>coral reef</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in512/10-425-barn.png' | relative_url }}" data-zoomable loading="lazy" alt="barn" /><figcaption>barn</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in512/11-437-beacon.png' | relative_url }}" data-zoomable loading="lazy" alt="beacon" /><figcaption>beacon</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in512/12-933-cheeseburger.png' | relative_url }}" data-zoomable loading="lazy" alt="cheeseburger" /><figcaption>cheeseburger</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in512/13-985-daisy.png' | relative_url }}" data-zoomable loading="lazy" alt="daisy" /><figcaption>daisy</figcaption></figure>
  <figure><img src="{{ '/assets/img/detour/in512/14-992-agaric.png' | relative_url }}" data-zoomable loading="lazy" alt="agaric" /><figcaption>agaric</figcaption></figure>
</div>

## Text to image

The path needs no class labels, so it transfers to text-to-image directly. With matched networks
it reaches comparable text alignment in **1.5× fewer training iterations** than plain pixel flow.

A 3.3B model scores **GenEval 0.90 / DPG-Bench 87.8** at 512×512 and **0.88 / 87.4** at 1024×1024 —
ahead of the pixel-space models we compare against at both resolutions, while keeping the fine
textures and rendered text that a semantic-latent decoder can lose.

<figure class="detour-fig">
  <img src="{{ '/assets/img/detour/t2i_convergence.jpg' | relative_url }}" data-zoomable data-zoom-src="{{ '/assets/img/detour/full/t2i_convergence.jpg' | relative_url }}" alt="Text-to-image convergence against plain pixel flow" />
</figure>

<figure class="detour-fig">
  <img src="{{ '/assets/img/detour/t2i_text_render.jpg' | relative_url }}" data-zoomable data-zoom-src="{{ '/assets/img/detour/full/t2i_text_render.jpg' | relative_url }}" alt="Rendered text" />
</figure>

## Gallery

Samples from the 3.3B model at about 1024×1024 and several aspect ratios.
Click any image to open it at full resolution.

<div class="detour-grid">
{% for i in (1..37) %}
  {% assign n = i | prepend: '0' | slice: -2, 2 %}
  <img src="{{ '/assets/img/detour/gallery/s' | append: n | append: '.jpg' | relative_url }}"
       data-zoomable
       data-zoom-src="{{ '/assets/img/detour/gallery/full/s' | append: n | append: '.jpg' | relative_url }}"
       loading="lazy" alt="Sample {{ i }}" />
{% endfor %}
</div>

### More samples

Fifty-two further samples from the same model, the set used in the appendix.
These sheets were saved at a lower resolution than the gallery above, so the
full-size view tops out near the model's own 1024 px rather than above it.

<div class="detour-grid">
{% for i in (1..52) %}
  {% assign n = i | prepend: '0' | slice: -2, 2 %}
  <img src="{{ '/assets/img/detour/appendix/a' | append: n | append: '.jpg' | relative_url }}"
       data-zoomable
       data-zoom-src="{{ '/assets/img/detour/appendix/full/a' | append: n | append: '.jpg' | relative_url }}"
       loading="lazy" alt="Appendix sample {{ i }}" />
{% endfor %}
</div>

## Architecture, briefly

A 32-pixel encoder lays out the image and passes its tokens to a 16-pixel decoder that predicts
image and code together. The loss is a single velocity objective against targets $$x$$ and $$c(x)$$,
with DINOv2 frozen throughout — it is used to define the path, never trained.

<figure class="detour-fig">
  <img src="{{ '/assets/img/detour/t2i_arch.jpg' | relative_url }}" data-zoomable data-zoom-src="{{ '/assets/img/detour/full/t2i_arch.jpg' | relative_url }}" alt="Text-to-image architectures" />
</figure>
