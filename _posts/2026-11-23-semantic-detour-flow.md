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
  .detour-links {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
    justify-content: center;
    margin: 1.4rem 0 .4rem;
  }
  .detour-links a, .detour-links span {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    padding: .42rem .95rem;
    border: 1px solid var(--global-divider-color);
    border-radius: 999px;
    font-size: .88rem;
    line-height: 1;
    text-decoration: none;
    color: var(--global-text-color);
    transition: border-color .18s ease, color .18s ease;
  }
  .detour-links a:hover { border-color: var(--global-theme-color); color: var(--global-theme-color); }
  .detour-links span { opacity: .55; cursor: default; }
  .detour-links .soon {
    font-size: .68rem;
    text-transform: uppercase;
    letter-spacing: .07em;
    opacity: .75;
  }
  .detour-wide {
    overflow-x: auto;
    margin: 1.2rem 0;
    -webkit-overflow-scrolling: touch;
  }
  .detour-wide table { margin: 0; font-size: .8rem; white-space: nowrap; }
  .detour-wide td, .detour-wide th { padding: .3rem .5rem; }
  .detour-wide tbody tr.ours { font-weight: 600; }
  .detour-wide tbody tr.latent td { opacity: .55; }
  .detour-note {
    font-size: .82rem;
    opacity: .7;
    margin: -.4rem 0 1.4rem;
  }
  .detour-feedback {
    border-left: 3px solid var(--global-theme-color);
    padding: .1rem 0 .1rem 1rem;
    margin: 2rem 0 .5rem;
  }
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

<div class="detour-links">
  <span>Paper <span class="soon">coming soon</span></span>
  <span>Code <span class="soon">coming soon</span></span>
  <span>Checkpoints <span class="soon">coming soon</span></span>
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

### Against the field

Grey rows are latent-space models, which carry a decoder; the rest are pixel space. The epoch column
is the one that matters — most entries above us are trained three to eight times longer.

<div class="detour-wide" markdown="1">

| ImageNet 256×256 | Params | Ep. | FID-50k | IS | Prec. | Rec. |
|---|---|---|---|---|---|---|
| DiT-XL/2 | 675M | 1400 | 2.27 | 278 | 0.83 | 0.57 |
| REPA | 675M | 800 | 1.42 | 306 | 0.80 | 0.65 |
| LightningDiT | 675M | 800 | 1.35 | 295 | 0.79 | 0.65 |
| RAE | 839M | 800 | 1.13 | 263 | 0.78 | 0.67 |
| ADM-G | 554M | 396 | 4.59 | 187 | 0.82 | 0.52 |
| SiD2 | — | 1280 | 1.38 | — | — | — |
| PixNerd | 700M | 320 | 1.93 | 298 | 0.80 | 0.60 |
| DeCo | 682M | 800 | 1.62 | 301 | 0.80 | 0.62 |
| PixelDiT | 797M | 320 | 1.61 | 293 | 0.78 | 0.64 |
| JiT-G/16 | 2B | 600 | 1.82 | 293 | 0.79 | 0.62 |
| PixelREPA-H | 953M | 600 | 1.81 | 317 | — | — |
| PixelDiT2-H | 1.0B | 600 | 1.46 | 302 | — | — |
| PixSGR-H | 875M | 320 | 1.51 | 311 | 0.78 | 0.65 |
| *≤ 200 epochs* | | | | | | |
| JiT-XL/16 | 676M | 200 | 2.89 | 272 | 0.85 | 0.66 |
| JiT-G/16 | 2B | 200 | 2.15 | — | — | — |
| LatentForcing-L | 465M | 200 | 2.48 | — | — | — |
| Dino Forcing-XL | 686M | 200 | 2.13 | 310 | 0.83 | 0.71 |
| PixelGen | 676M | 160 | 1.83 | 294 | 0.79 | 0.63 |
| **Detour-XL/16** | 849M | 200 | **1.43** | 267 | 0.77 | 0.65 |
| **Detour-XL/16** | 849M | 320 | **1.35** | 267 | 0.76 | 0.67 |
{: .detour}

</div>

<div class="detour-wide" markdown="1">

| ImageNet 512×512 | Params | Ep. | FID-50k | IS | Prec. | Rec. |
|---|---|---|---|---|---|---|
| DiT-XL/2 | 675M | 600 | 3.04 | 241 | 0.84 | 0.54 |
| REPA | 675M | 200 | 2.08 | 275 | 0.83 | 0.58 |
| EDM2-XXL | 1.5B | 733 | 1.25 | — | — | — |
| RAE | 839M | 400 | 1.13 | 260 | 0.80 | 0.63 |
| ADM-G | 559M | 388 | 7.72 | 173 | 0.87 | 0.42 |
| SiD2 | — | 1280 | 1.48 | — | — | — |
| PixNerd | 700M | 320+ | 2.45 | 276 | 0.79 | 0.63 |
| PixelDiT | 797M | 850 | 1.81 | 279 | 0.78 | 0.67 |
| JiT-G/32 | 2B | 600 | 1.78 | 307 | — | — |
| WaiT-G/32 | 2B | — | 1.67 | — | — | — |
| PixSGR-H/32 | 879M | 300 | 1.60 | 318 | — | — |
| PixelDiT2-H/16 | 1.1B | 680 | 1.48 | 296 | — | — |
| WaiT-G/16 | 2B | — | 1.30 | — | — | — |
| *≤ 200 epochs* | | | | | | |
| JiT-H/32 | 956M | 200 | 2.51 | — | — | — |
| JiT-G/32 | 2B | 200 | 2.11 | — | — | — |
| **Detour-XL/32** | 849M | 160 | **1.59** | 286 | 0.79 | 0.65 |
| **Detour-XL/32** | 849M | 280 | **1.35** | 297 | 0.79 | 0.68 |
{: .detour}

</div>

### Where the gain comes from

FID folds fidelity and coverage into one number, so a model can improve it by sharpening samples and
quietly shedding diversity. Precision and recall separate the two. Measured with the ADM evaluator on
the same 50k samples that produced each FID:

| Checkpoint | Precision | Recall | FID-50k |
|---|---|---|---|
| 256, epoch 200 | 0.765 | 0.653 | 1.427 |
| **256, epoch 320** | 0.761 | **0.670** | **1.353** |
| 512, epoch 160 | 0.794 | 0.649 | 1.587 |
| **512, epoch 280** | 0.788 | **0.680** | **1.355** |
{: .detour}

Precision is flat at both resolutions — within run-to-run variation — while recall gains 1.7 points at
256 and 3.1 at 512. **The improvement is coverage, not fidelity.** The model is not trading away
diversity to buy a better score, which is the failure a FID-only comparison would have hidden.

### 256×256

**Model samples, not real images.** One sample per class from Detour-XL/16 at **epoch 200**,
CFG 1.75 + AutoGuidance 2.0 — the setting that gives FID-50k 1.43, not the epoch-320 setting quoted
above. Shown at the model's native 256×256, uncurated. Click to view at full size.

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

**Model samples, not real images.** Detour-XL/32, CFG 2.5 + AutoGuidance 2.0, at the native
512×512. Fifteen picks selected from a 50k sampling run — chosen, unlike the 256 grid above, which is
one sample per class.

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

Both rows below are the same checkpoint, evaluated at the two resolutions it was trained on. No prompt
rewriting is used anywhere in the table. Grey rows are latent-space models.

<div class="detour-wide" markdown="1">

| | Params | Res | Single | Two | Count | Colors | Position | Attr. | **GenEval** | Global | Entity | Attribute | Relation | Other | **DPG** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SD3-Medium | 2B | 1024 | 0.98 | 0.74 | 0.63 | 0.67 | 0.34 | 0.36 | 0.62 | 87.9 | 91.0 | 88.8 | 80.7 | 88.7 | 84.1 |
| FLUX.1-dev | 12B | 1024 | 0.98 | 0.81 | 0.74 | 0.79 | 0.22 | 0.45 | 0.66 | 74.4 | 90.0 | 89.0 | 90.9 | 88.3 | 83.8 |
| SANA-1.6B | 1.6B | 1024 | 0.99 | 0.77 | 0.62 | 0.88 | 0.21 | 0.47 | 0.66 | 86.0 | 91.5 | 88.9 | 91.9 | 90.7 | 84.8 |
| Lumina-Image 2.0 | 2.6B | 1024 | — | 0.87 | 0.67 | — | — | 0.62 | 0.73 | — | 92.0 | 90.2 | 94.9 | — | 87.2 |
| Z-Image-Turbo | 6B | 1024 | 1.00 | 0.95 | 0.77 | 0.89 | 0.65 | 0.68 | 0.82 | 91.3 | 89.6 | 90.1 | 92.2 | 88.7 | 84.9 |
| Qwen-Image | 20B | 1024 | 0.99 | 0.92 | 0.89 | 0.88 | 0.76 | 0.77 | 0.87 | 91.3 | 91.6 | 92.0 | 94.3 | 92.7 | 88.3 |
| PixNerd-XXL/16 | 1.2B | 512 | 0.97 | 0.86 | 0.44 | 0.83 | 0.71 | 0.53 | 0.73 | 80.5 | 87.9 | 87.2 | 91.3 | 72.8 | 80.9 |
| PixelDiT | 1.3B | 512 | 1.00 | 0.94 | 0.70 | 0.90 | 0.53 | 0.65 | 0.78 | 88.0 | 90.9 | 87.6 | 89.8 | 88.5 | 83.7 |
| PixelGen-XXL/16 | 1.1B | 512 | 0.99 | 0.88 | 0.59 | 0.90 | 0.70 | 0.70 | 0.79 | — | — | — | — | — | — |
| DeCo-XXL/16 | 1.1B | 512 | 1.00 | 0.92 | 0.72 | 0.91 | 0.80 | 0.79 | 0.86 | — | — | — | — | — | 81.4 |
| RG-T2I-L/16 | 0.9B | 512 | — | — | — | — | — | — | 0.89 | — | — | — | — | — | 87.1 |
| MiniT2I-L/16 | 0.9B | 512 | — | — | — | — | — | — | 0.88 | — | — | — | — | — | 85.9 |
| PixelFlow-XL/4 | 0.9B | 512 | — | — | — | — | — | — | 0.60 | — | — | — | — | — | 77.9 |
| Iris | 3B | 1024 | — | — | — | — | — | — | 0.80 | — | — | — | — | — | 86.5 |
| Tuna-2 | 7B | 1024 | 0.99 | 0.96 | 0.80 | 0.91 | 0.84 | 0.76 | 0.87 | 89.5 | 91.4 | 92.1 | 91.9 | 88.8 | 86.5 |
| **Detour** | 3.3B | 512 | **1.00** | 0.96 | **0.83** | **0.93** | **0.86** | 0.81 | **0.90** | 85.3 | **92.5** | 90.7 | **94.9** | 85.7 | **87.8** |
| **Detour** | 3.3B | 1024 | 0.98 | **0.98** | 0.78 | 0.89 | 0.83 | **0.82** | 0.88 | 85.3 | 92.3 | 90.4 | **94.9** | 85.9 | 87.4 |
{: .detour}

</div>

<p class="detour-note">Bold marks the best pixel-space score in each column; — is unreported. Baselines
are taken from their original papers or from Tuna-2, SANA, Janus-Pro and Qwen-Image.</p>

The per-task breakdown is where the path shows itself. Counting (0.83) and position (0.86) are the two
GenEval tasks that need the layout settled before any texture is drawn, and they are exactly the tasks
pixel-space models usually lose — PixNerd scores 0.44 on counting, PixelDiT 0.53 on position. Deciding
semantics first is worth more there than anywhere else.

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

## Which encoder, and how wide a code?

The default code is DINOv2-B with 768 channels, chosen because that is exactly a 16×16×3 pixel patch:
the pixel shuffle $$\Phi$$ then maps the code into an RGB-shaped state without changing its dimension
or its norm. Two questions follow. What happens when the encoder's width doesn't match, and does the
choice of encoder matter at all?

All runs below are JiT-B/16 on ImageNet 256 for 80 epochs, unguided, with the same sampler — relative
comparisons, not best achievable numbers.

| Encoder | Fit | $$C$$ | State | Var. kept | Ch. var. | $$R^2$$ | FID-50k |
|---|---|---|---|---|---|---|---|
| DINOv2-B | — | 768 | 3 | 1.000 | — | — | 16.85 |
| DINOv2-L | project | 768 | 3 | 0.947 | 0.78–1.30 | 0.682 | **15.01** |
| DINOv2-L | pad | 1024 | 4 | 1.000 | 0.22–17.48 | — | 17.39 |
| MAE | — | 768 | 3 | 1.000 | 0.09–35.96 | 0.916 | 22.77 |
| LeJEPA | — | 768 | 3 | 1.000 | 0.48–17.70 | 0.793 | 23.05 |
{: .detour}

**Projecting beats padding.** DINOv2-L has 1024 channels, which pixel shuffle turns into a four-channel
state — and the fourth channel has no clean image behind it, only code. Projecting down to 768 instead
keeps the original three-channel state and the unmodified pixel-space architecture, and wins by 1.6
FID-10k and 2.4 FID-50k, *despite throwing away 5.3% of the token variance*. Keeping the state shaped
like an image matters more than keeping every direction of the feature.

How the projection is built matters too. Taking the top 768 PCA directions alone leaves channel
variances spread across 0.23–25.3, which pixel shuffle then distributes unevenly across the three RGB
planes. Adding a fixed random orthogonal rotation after the projection balances them to 0.78–1.30 and
equalises the planes to 0.998 : 1.001 : 1.001 — no information is lost, since the rotation is
orthogonal; it is only spread more evenly across pixel space.

**The encoder is not interchangeable.** Swapping DINOv2 for MAE or LeJEPA at the same 768 channels and
the same architecture costs about 7.6 FID. The interesting part is that neither obvious explanation
survives:

- *Pixel predictability* — how well a linear ridge regressor reconstructs a patch from its code.
  MAE is **best** at this ($$R^2$$ 0.916, against 0.682 for projected DINOv2-L) and generates worst.
  Easier reconstruction does not mean easier generation.
- *Channel conditioning* — the spread of per-channel variance. LeJEPA is far better conditioned than
  MAE (37× against 400×), yet they land within 0.3 FID of each other.

So DINOv2's advantage is not that its features are easy to decode, nor that they are well scaled. What
is left is the semantic structure itself — which is the thing the detour path actually travels along.

## Architecture, briefly

A 32-pixel encoder lays out the image and passes its tokens to a 16-pixel decoder that predicts
image and code together. The loss is a single velocity objective against targets $$x$$ and $$c(x)$$,
with DINOv2 frozen throughout — it is used to define the path, never trained.

<figure class="detour-fig">
  <img src="{{ '/assets/img/detour/t2i_arch.jpg' | relative_url }}" data-zoomable data-zoom-src="{{ '/assets/img/detour/full/t2i_arch.jpg' | relative_url }}" alt="Text-to-image architectures" />
</figure>

## Feedback

<div class="detour-feedback" markdown="1">
Questions, corrections and requests for a particular ablation are all welcome — especially if a number
here does not match what you measure. The paper, the code and the checkpoints are all coming shortly;
if you want to be pointed at them when they land, or you think something above is wrong, write to me
at the address in the site footer.
</div>
