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
    transition: transform .18s ease, box-shadow .18s ease;
  }
  .detour-grid img:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0,0,0,.18);
  }
  .detour-lede {
    font-size: 1.05rem;
    line-height: 1.6;
  }
  .detour-num {
    display: flex;
    flex-wrap: wrap;
    gap: 1.6rem;
    margin: 1.6rem 0;
  }
  .detour-num div { min-width: 0; }
  .detour-num .v {
    font-size: 1.9rem;
    font-weight: 600;
    line-height: 1.1;
  }
  .detour-num .k {
    font-size: .82rem;
    text-transform: uppercase;
    letter-spacing: .06em;
    opacity: .68;
  }
  table.detour td, table.detour th { padding: .35rem .6rem; }
---

Diffusion models trained in semantic latent spaces converge much faster than pixel-space
models, but they inherit a decoder that caps fine detail. **Semantic Detour Flow** closes most
of that gap without any decoder: it is a pixel-space flow that follows frozen DINOv2 features
at high noise and hands over to pixels at low noise. One network, one velocity loss, and
sampling that runs entirely in pixel space.

<div class="detour-num">
  <div><div class="v">92.8 → 38.8</div><div class="k">FID-10k, 20 epochs, same network</div></div>
  <div><div class="v">1.43</div><div class="k">FID-50k, ImageNet 256</div></div>
  <div><div class="v">1.59</div><div class="k">FID-50k, ImageNet 512</div></div>
  <div><div class="v">0.90 / 87.8</div><div class="k">GenEval / DPG-Bench, 512</div></div>
</div>

{% include figure.html path="assets/img/detour/teaser.jpg" class="img-fluid rounded" zoomable=true alt="Samples from Semantic Detour Flow" %}

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

{% include video.html path="assets/video/detour_path.mp4" class="img-fluid rounded" controls=true autoplay=true loop=true muted=true %}

{% include figure.html path="assets/img/detour/system.jpg" class="img-fluid" zoomable=true alt="The detour path and the network" %}

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

Guidance matters, and the two kinds compose. Classifier-free guidance alone plateaus; autoguidance
alone is already better at a much lower Inception score; together they are better than either.

| Sampling (Detour-XL/16, epoch 200) | FID-50k | IS |
|---|---|---|
| Unguided | 3.69 | 182 |
| CFG 2.25 on [0.05, 0.9] | 2.27 | 283 |
| AutoGuidance 2.0 | 1.81 | 210 |
| **CFG 1.75 + AutoGuidance 2.0** | **1.43** | 267 |
{: .detour}

<div class="row">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.html path="assets/img/detour/imagenet256.jpg" class="img-fluid rounded" zoomable=true alt="ImageNet 256 samples" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.html path="assets/img/detour/imagenet512.jpg" class="img-fluid rounded" zoomable=true alt="ImageNet 512 samples" %}
  </div>
</div>
<div class="caption">ImageNet samples at 256×256 (left) and 512×512 (right).</div>

## Text to image

The path needs no class labels, so it transfers to text-to-image directly. With matched networks
it reaches comparable text alignment in **1.5× fewer training iterations** than plain pixel flow.

A 3.3B model scores **GenEval 0.90 / DPG-Bench 87.8** at 512×512 and **0.88 / 87.4** at 1024×1024 —
ahead of the pixel-space models we compare against at both resolutions, while keeping the fine
textures and rendered text that a semantic-latent decoder can lose.

{% include figure.html path="assets/img/detour/t2i_convergence.jpg" class="img-fluid" zoomable=true alt="Text-to-image convergence against plain pixel flow" %}

{% include figure.html path="assets/img/detour/t2i_text_render.jpg" class="img-fluid" zoomable=true alt="Rendered text" %}

## Gallery

Fifty-two samples from the 3.3B model at 1024×1024. Click any image to enlarge.

<div class="detour-grid">
{% for i in (1..52) %}
  {% assign n = i | prepend: '0' | slice: -2, 2 %}
  <img src="{{ '/assets/img/detour/gallery/s' | append: n | append: '.jpg' | relative_url }}" data-zoomable loading="lazy" alt="Sample {{ i }}" />
{% endfor %}
</div>

## Architecture, briefly

A 32-pixel encoder lays out the image and passes its tokens to a 16-pixel decoder that predicts
image and code together. The loss is a single velocity objective against targets $$x$$ and $$c(x)$$,
with DINOv2 frozen throughout — it is used to define the path, never trained.

{% include figure.html path="assets/img/detour/t2i_arch.jpg" class="img-fluid" zoomable=true alt="Text-to-image architectures" %}

---

Quan Dao, Tuan Pham, Anh Nguyen, Duc Vu, Quyen Tran, Stephan Mandt, Dimitris Metaxas.
Rutgers University, UC Irvine, and Johns Hopkins University.
