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
  .dt-wrap { margin: 1.5rem 0; }
  .dt-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table.dt {
    width: 100%;
    margin: 0;
    border-collapse: collapse;
    font-size: .84rem;
    font-variant-numeric: tabular-nums;
  }
  table.dt th, table.dt td {
    padding: .34rem .55rem;
    border: 0;
    white-space: nowrap;
  }
  table.dt thead th {
    font-size: .7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .055em;
    opacity: .6;
    text-align: right;
    border-bottom: 1px solid var(--global-divider-color);
    vertical-align: bottom;
  }
  table.dt thead th:first-child { text-align: left; }
  table.dt thead th.grp {
    text-align: center;
    border-bottom: 0;
    padding-bottom: .1rem;
    opacity: .45;
  }
  table.dt thead tr.grp-row th.grp { border-bottom: 1px solid var(--global-divider-color); }
  table.dt td { text-align: right; }
  table.dt td:first-child { text-align: left; }
  table.dt tbody tr.sec td {
    font-size: .68rem;
    text-transform: uppercase;
    letter-spacing: .06em;
    opacity: .5;
    padding-top: .7rem;
    padding-bottom: .1rem;
  }
  table.dt tbody tr.latent td { opacity: .5; }
  table.dt tbody tr.ours td {
    font-weight: 600;
    background: var(--global-code-bg-color);
  }
  table.dt tbody tr.ours td:first-child { box-shadow: inset 2px 0 0 var(--global-theme-color); }
  table.dt tbody tr + tr td { border-top: 1px solid rgba(128,128,128,.12); }
  table.dt tbody tr.sec td, table.dt tbody tr.sec + tr td { border-top: 0; }
  table.dt .u { opacity: .35; }
  .dt-cap {
    font-size: .76rem;
    opacity: .6;
    margin: .5rem 0 0;
    white-space: normal;
  }
  @media (max-width: 640px) {
    table.dt { font-size: .76rem; }
    table.dt th, table.dt td { padding: .3rem .4rem; }
  }
  table.dt .sc {
    display: block;
    font-size: .68em;
    font-weight: 400;
    opacity: .5;
    letter-spacing: .01em;
    margin-top: .05rem;
  }
  table.dt .gsep { border-left: 1px solid rgba(128,128,128,.22); }
  table.dt thead th.grp.gsep { border-left: 1px solid rgba(128,128,128,.22); }
  .cit { font-size: .62em; vertical-align: super; line-height: 0; margin-left: .1em; }
  .cit a { text-decoration: none; opacity: .75; }
  .cit a:hover { opacity: 1; }
  table.dt .cit { opacity: .6; }
  ol.dt-refs {
    font-size: .82rem;
    line-height: 1.5;
    opacity: .85;
    padding-left: 1.4rem;
  }
  ol.dt-refs li { margin-bottom: .3rem; }
  ol.dt-refs li:target { background: var(--global-code-bg-color); }
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
of that gap without any decoder: it is a pixel-space flow that follows frozen DINOv2 features<sup class="cit"><a href="#ref-1">1</a></sup>
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

<div class="dt-wrap"><div class="dt-scroll">
<table class="dt">
<thead>
<tr><th>Model</th><th>FID-10k, 20 ep.</th><th>&Delta;</th><th>FID-50k, 80 ep.</th></tr>
</thead><tbody>
<tr><td>Pixel flow (JiT, same network)</td><td>92.8</td><td><span class="u">&ndash;</span></td><td>48.3</td></tr>
<tr><td>+ detour path</td><td>66.6</td><td>&minus;26.2</td><td><span class="u">&ndash;</span></td></tr>
<tr><td>+ trigonometric mix</td><td>52.7</td><td>&minus;13.9</td><td><span class="u">&ndash;</span></td></tr>
<tr><td>+ norm bump</td><td>49.1</td><td>&minus;3.6</td><td><span class="u">&ndash;</span></td></tr>
<tr><td>+ fitted logit-normal $$t$$</td><td>47.9</td><td>&minus;1.2</td><td>23.4</td></tr>
<tr><td>+ interval sampling</td><td>45.5</td><td>&minus;2.4</td><td>20.4</td></tr>
<tr class="ours"><td>+ multi-layer code</td><td>38.8</td><td>&minus;6.7</td><td>15.8</td></tr>
</tbody></table></div>
<p class="dt-cap">JiT-B, 296M parameters, unguided, Heun 50 with a uniform time grid.</p>
</div>

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

Guidance matters, and the two kinds compose. Classifier-free guidance<sup class="cit"><a href="#ref-2">2</a></sup> alone plateaus; autoguidance<sup class="cit"><a href="#ref-3">3</a></sup>
alone is already better at a much lower Inception score; together they are better than either.

<div class="dt-wrap"><div class="dt-scroll">
<table class="dt">
<thead>
<tr class="grp-row"><th></th><th class="grp gsep" colspan="2">256, epoch 200</th><th class="grp gsep" colspan="2">256, epoch 320</th><th class="grp gsep" colspan="2">512, epoch 280</th></tr>
<tr><th>Guidance</th><th class="gsep">FID-50k</th><th>IS</th><th class="gsep">FID-50k</th><th>IS</th><th class="gsep">FID-50k</th><th>IS</th></tr>
</thead><tbody>
<tr><td>Unguided</td><td class="gsep">3.69</td><td>182</td><td class="gsep">3.24</td><td>192</td><td class="gsep">3.73</td><td>201</td></tr>
<tr><td>CFG only</td><td class="gsep">2.27<span class="sc">scale 2.25</span></td><td>283</td><td class="gsep">2.13<span class="sc">scale 2.5</span></td><td>300</td><td class="gsep">2.32<span class="sc">scale 4.0</span></td><td>334</td></tr>
<tr><td>AutoGuidance only</td><td class="gsep">1.81<span class="sc">scale 2.0</span></td><td>210</td><td class="gsep">1.59<span class="sc">scale 2.0</span></td><td>220</td><td class="gsep">1.54<span class="sc">scale 2.0</span></td><td>238</td></tr>
<tr class="ours"><td>CFG + AutoGuidance</td><td class="gsep">1.43<span class="sc">1.75 + 2.0</span></td><td>267</td><td class="gsep">1.35<span class="sc">1.625 + 2.0</span></td><td>267</td><td class="gsep">1.35<span class="sc">2.0 + 2.0</span></td><td>297</td></tr>
</tbody></table></div>
<p class="dt-cap">Euler 100 on the grid $$t=u^4$$, EMA2, guidance on the window [0.05, 0.9]. Small
figures are the guidance scales; AutoGuidance always contrasts against the same run at epoch 20.</p>
</div>

Note what CFG alone does to the Inception score: it is the *highest* of the four at both resolutions
(300 and 334) while the FID is a full point worse. A large guidance scale buys class-typicality at the
cost of diversity, and FID sees the bill that IS does not.

### Against the field

Grey rows are latent-space models, which carry a decoder; the rest are pixel space. The epoch column
is the one that matters — most entries above us are trained three to eight times longer.

<div class="dt-wrap"><div class="dt-scroll">
<table class="dt">
<thead>
<tr><th>Method</th><th>Params</th><th>Ep.</th><th>FID-50k</th><th>IS</th><th>Prec.</th><th>Rec.</th></tr>
</thead><tbody>
<tr class="latent"><td>DiT-XL/2<sup class="cit"><a href="#ref-4">4</a></sup></td><td>675M</td><td>1400</td><td>2.27</td><td>278</td><td>0.83</td><td>0.57</td></tr>
<tr class="latent"><td>REPA<sup class="cit"><a href="#ref-5">5</a></sup></td><td>675M</td><td>800</td><td>1.42</td><td>306</td><td>0.80</td><td>0.65</td></tr>
<tr class="latent"><td>LightningDiT<sup class="cit"><a href="#ref-6">6</a></sup></td><td>675M</td><td>800</td><td>1.35</td><td>295</td><td>0.79</td><td>0.65</td></tr>
<tr class="latent"><td>RAE<sup class="cit"><a href="#ref-7">7</a></sup></td><td>839M</td><td>800</td><td>1.13</td><td>263</td><td>0.78</td><td>0.67</td></tr>
<tr><td>ADM-G<sup class="cit"><a href="#ref-8">8</a></sup></td><td>554M</td><td>396</td><td>4.59</td><td>187</td><td>0.82</td><td>0.52</td></tr>
<tr><td>SiD2<sup class="cit"><a href="#ref-9">9</a></sup></td><td><span class="u">&ndash;</span></td><td>1280</td><td>1.38</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td></tr>
<tr><td>PixNerd<sup class="cit"><a href="#ref-10">10</a></sup></td><td>700M</td><td>320</td><td>1.93</td><td>298</td><td>0.80</td><td>0.60</td></tr>
<tr><td>DeCo<sup class="cit"><a href="#ref-11">11</a></sup></td><td>682M</td><td>800</td><td>1.62</td><td>301</td><td>0.80</td><td>0.62</td></tr>
<tr><td>PixelDiT<sup class="cit"><a href="#ref-12">12</a></sup></td><td>797M</td><td>320</td><td>1.61</td><td>293</td><td>0.78</td><td>0.64</td></tr>
<tr><td>JiT-G/16<sup class="cit"><a href="#ref-13">13</a></sup></td><td>2B</td><td>600</td><td>1.82</td><td>293</td><td>0.79</td><td>0.62</td></tr>
<tr><td>PixelREPA-H<sup class="cit"><a href="#ref-14">14</a></sup></td><td>953M</td><td>600</td><td>1.81</td><td>317</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td></tr>
<tr><td>PixelDiT2-H<sup class="cit"><a href="#ref-15">15</a></sup></td><td>1.0B</td><td>600</td><td>1.46</td><td>302</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td></tr>
<tr><td>PixSGR-H<sup class="cit"><a href="#ref-16">16</a></sup></td><td>875M</td><td>320</td><td>1.51</td><td>311</td><td>0.78</td><td>0.65</td></tr>
<tr class="sec"><td colspan="7">200 epochs or fewer</td></tr>
<tr><td>JiT-XL/16<sup class="cit"><a href="#ref-13">13</a></sup></td><td>676M</td><td>200</td><td>2.89</td><td>272</td><td>0.85</td><td>0.66</td></tr>
<tr><td>JiT-G/16<sup class="cit"><a href="#ref-13">13</a></sup></td><td>2B</td><td>200</td><td>2.15</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td></tr>
<tr><td>LatentForcing-L<sup class="cit"><a href="#ref-17">17</a></sup></td><td>465M</td><td>200</td><td>2.48</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td></tr>
<tr><td>Dino Forcing-XL<sup class="cit"><a href="#ref-18">18</a></sup></td><td>686M</td><td>200</td><td>2.13</td><td>310</td><td>0.83</td><td>0.71</td></tr>
<tr><td>PixelGen<sup class="cit"><a href="#ref-19">19</a></sup></td><td>676M</td><td>160</td><td>1.83</td><td>294</td><td>0.79</td><td>0.63</td></tr>
<tr class="ours"><td>Detour-XL/16</td><td>849M</td><td>200</td><td>1.43</td><td>267</td><td>0.77</td><td>0.65</td></tr>
<tr class="ours"><td>Detour-XL/16</td><td>849M</td><td>320</td><td>1.35</td><td>267</td><td>0.76</td><td>0.67</td></tr>
</tbody></table></div>
<p class="dt-cap">ImageNet 256&times;256. Muted rows are latent-space models, which carry a decoder; the rest generate in pixel space.</p>
</div>

<div class="dt-wrap"><div class="dt-scroll">
<table class="dt">
<thead>
<tr><th>Method</th><th>Params</th><th>Ep.</th><th>FID-50k</th><th>IS</th><th>Prec.</th><th>Rec.</th></tr>
</thead><tbody>
<tr class="latent"><td>DiT-XL/2<sup class="cit"><a href="#ref-4">4</a></sup></td><td>675M</td><td>600</td><td>3.04</td><td>241</td><td>0.84</td><td>0.54</td></tr>
<tr class="latent"><td>REPA<sup class="cit"><a href="#ref-5">5</a></sup></td><td>675M</td><td>200</td><td>2.08</td><td>275</td><td>0.83</td><td>0.58</td></tr>
<tr class="latent"><td>EDM2-XXL<sup class="cit"><a href="#ref-20">20</a></sup></td><td>1.5B</td><td>733</td><td>1.25</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td></tr>
<tr class="latent"><td>RAE<sup class="cit"><a href="#ref-7">7</a></sup></td><td>839M</td><td>400</td><td>1.13</td><td>260</td><td>0.80</td><td>0.63</td></tr>
<tr><td>ADM-G<sup class="cit"><a href="#ref-8">8</a></sup></td><td>559M</td><td>388</td><td>7.72</td><td>173</td><td>0.87</td><td>0.42</td></tr>
<tr><td>SiD2<sup class="cit"><a href="#ref-9">9</a></sup></td><td><span class="u">&ndash;</span></td><td>1280</td><td>1.48</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td></tr>
<tr><td>PixNerd<sup class="cit"><a href="#ref-10">10</a></sup></td><td>700M</td><td>320+</td><td>2.45</td><td>276</td><td>0.79</td><td>0.63</td></tr>
<tr><td>PixelDiT<sup class="cit"><a href="#ref-12">12</a></sup></td><td>797M</td><td>850</td><td>1.81</td><td>279</td><td>0.78</td><td>0.67</td></tr>
<tr><td>JiT-G/32<sup class="cit"><a href="#ref-13">13</a></sup></td><td>2B</td><td>600</td><td>1.78</td><td>307</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td></tr>
<tr><td>WaiT-G/32<sup class="cit"><a href="#ref-21">21</a></sup></td><td>2B</td><td>600</td><td>1.67</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td></tr>
<tr><td>PixSGR-H/32<sup class="cit"><a href="#ref-16">16</a></sup></td><td>879M</td><td>300</td><td>1.60</td><td>318</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td></tr>
<tr><td>PixelDiT2-H/16<sup class="cit"><a href="#ref-15">15</a></sup></td><td>1.1B</td><td>680</td><td>1.48</td><td>296</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td></tr>
<tr><td>WaiT-G/16<sup class="cit"><a href="#ref-21">21</a></sup></td><td>2B</td><td>600</td><td>1.30</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td></tr>
<tr class="sec"><td colspan="7">200 epochs or fewer</td></tr>
<tr><td>JiT-H/32<sup class="cit"><a href="#ref-13">13</a></sup></td><td>956M</td><td>200</td><td>2.51</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td></tr>
<tr><td>JiT-G/32<sup class="cit"><a href="#ref-13">13</a></sup></td><td>2B</td><td>200</td><td>2.11</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td></tr>
<tr class="ours"><td>Detour-XL/32</td><td>849M</td><td>160</td><td>1.59</td><td>286</td><td>0.79</td><td>0.65</td></tr>
<tr class="ours"><td>Detour-XL/32</td><td>849M</td><td>280</td><td>1.35</td><td>297</td><td>0.79</td><td>0.68</td></tr>
</tbody></table></div>
<p class="dt-cap">ImageNet 512&times;512. Same convention.</p>
</div>

### 256×256

One sample per class from Detour-XL/16 at **epoch 200**,
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

Detour-XL/32, CFG 2.5 + AutoGuidance 2.0, at the native
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

Both Detour rows are the same checkpoint, evaluated at the two resolutions it was trained on. No prompt
rewriting is used anywhere. Muted rows are latent-space models.

### GenEval

<div class="dt-wrap"><div class="dt-scroll">
<table class="dt">
<thead>
<tr><th>Method</th><th>Params</th><th>Res</th><th>Single</th><th>Two</th><th>Count</th><th>Colors</th><th>Position</th><th>Attr.</th><th>Overall</th></tr>
</thead><tbody>
<tr class="latent"><td>SD3-Medium<sup class="cit"><a href="#ref-22">22</a></sup></td><td>2B</td><td>1024</td><td>0.98</td><td>0.74</td><td>0.63</td><td>0.67</td><td>0.34</td><td>0.36</td><td>0.62</td></tr>
<tr class="latent"><td>FLUX.1-dev<sup class="cit"><a href="#ref-23">23</a></sup></td><td>12B</td><td>1024</td><td>0.98</td><td>0.81</td><td>0.74</td><td>0.79</td><td>0.22</td><td>0.45</td><td>0.66</td></tr>
<tr class="latent"><td>SANA-1.6B<sup class="cit"><a href="#ref-24">24</a></sup></td><td>1.6B</td><td>1024</td><td>0.99</td><td>0.77</td><td>0.62</td><td>0.88</td><td>0.21</td><td>0.47</td><td>0.66</td></tr>
<tr class="latent"><td>Lumina-Image 2.0<sup class="cit"><a href="#ref-25">25</a></sup></td><td>2.6B</td><td>1024</td><td><span class="u">&ndash;</span></td><td>0.87</td><td>0.67</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td>0.62</td><td>0.73</td></tr>
<tr class="latent"><td>Z-Image-Turbo<sup class="cit"><a href="#ref-26">26</a></sup></td><td>6B</td><td>1024</td><td>1.00</td><td>0.95</td><td>0.77</td><td>0.89</td><td>0.65</td><td>0.68</td><td>0.82</td></tr>
<tr class="latent"><td>Qwen-Image<sup class="cit"><a href="#ref-27">27</a></sup></td><td>20B</td><td>1024</td><td>0.99</td><td>0.92</td><td>0.89</td><td>0.88</td><td>0.76</td><td>0.77</td><td>0.87</td></tr>
<tr><td>PixNerd-XXL/16<sup class="cit"><a href="#ref-10">10</a></sup></td><td>1.2B</td><td>512</td><td>0.97</td><td>0.86</td><td>0.44</td><td>0.83</td><td>0.71</td><td>0.53</td><td>0.73</td></tr>
<tr><td>PixelDiT<sup class="cit"><a href="#ref-12">12</a></sup></td><td>1.3B</td><td>512</td><td>1.00</td><td>0.94</td><td>0.70</td><td>0.90</td><td>0.53</td><td>0.65</td><td>0.78</td></tr>
<tr><td>PixelGen-XXL/16<sup class="cit"><a href="#ref-19">19</a></sup></td><td>1.1B</td><td>512</td><td>0.99</td><td>0.88</td><td>0.59</td><td>0.90</td><td>0.70</td><td>0.70</td><td>0.79</td></tr>
<tr><td>DeCo-XXL/16<sup class="cit"><a href="#ref-11">11</a></sup></td><td>1.1B</td><td>512</td><td>1.00</td><td>0.92</td><td>0.72</td><td>0.91</td><td>0.80</td><td>0.79</td><td>0.86</td></tr>
<tr><td>RG-T2I-L/16<sup class="cit"><a href="#ref-28">28</a></sup></td><td>0.9B</td><td>512</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td>0.89</td></tr>
<tr><td>MiniT2I-L/16<sup class="cit"><a href="#ref-29">29</a></sup></td><td>0.9B</td><td>512</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td>0.88</td></tr>
<tr><td>PixelFlow-XL/4<sup class="cit"><a href="#ref-30">30</a></sup></td><td>0.9B</td><td>512</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td>0.60</td></tr>
<tr><td>Iris<sup class="cit"><a href="#ref-31">31</a></sup></td><td>3B</td><td>1024</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td>0.80</td></tr>
<tr><td>Tuna-2<sup class="cit"><a href="#ref-32">32</a></sup></td><td>7B</td><td>1024</td><td>0.99</td><td>0.96</td><td>0.80</td><td>0.91</td><td>0.84</td><td>0.76</td><td>0.87</td></tr>
<tr class="ours"><td>Detour</td><td>3.3B</td><td>512</td><td>1.00</td><td>0.96</td><td>0.83</td><td>0.93</td><td>0.86</td><td>0.81</td><td>0.90</td></tr>
<tr class="ours"><td>Detour</td><td>3.3B</td><td>1024</td><td>0.98</td><td>0.98</td><td>0.78</td><td>0.89</td><td>0.83</td><td>0.82</td><td>0.88</td></tr>
</tbody></table></div>
<p class="dt-cap">Counting and position are the two tasks that need the layout settled before any
texture is drawn &mdash; and the two that pixel-space models usually lose.</p>
</div>

### DPG-Bench

<div class="dt-wrap"><div class="dt-scroll">
<table class="dt">
<thead>
<tr><th>Method</th><th>Params</th><th>Res</th><th>Global</th><th>Entity</th><th>Attribute</th><th>Relation</th><th>Other</th><th>Overall</th></tr>
</thead><tbody>
<tr class="latent"><td>SD3-Medium<sup class="cit"><a href="#ref-22">22</a></sup></td><td>2B</td><td>1024</td><td>87.9</td><td>91.0</td><td>88.8</td><td>80.7</td><td>88.7</td><td>84.1</td></tr>
<tr class="latent"><td>FLUX.1-dev<sup class="cit"><a href="#ref-23">23</a></sup></td><td>12B</td><td>1024</td><td>74.4</td><td>90.0</td><td>89.0</td><td>90.9</td><td>88.3</td><td>83.8</td></tr>
<tr class="latent"><td>SANA-1.6B<sup class="cit"><a href="#ref-24">24</a></sup></td><td>1.6B</td><td>1024</td><td>86.0</td><td>91.5</td><td>88.9</td><td>91.9</td><td>90.7</td><td>84.8</td></tr>
<tr class="latent"><td>Lumina-Image 2.0<sup class="cit"><a href="#ref-25">25</a></sup></td><td>2.6B</td><td>1024</td><td><span class="u">&ndash;</span></td><td>92.0</td><td>90.2</td><td>94.9</td><td><span class="u">&ndash;</span></td><td>87.2</td></tr>
<tr class="latent"><td>Z-Image-Turbo<sup class="cit"><a href="#ref-26">26</a></sup></td><td>6B</td><td>1024</td><td>91.3</td><td>89.6</td><td>90.1</td><td>92.2</td><td>88.7</td><td>84.9</td></tr>
<tr class="latent"><td>Qwen-Image<sup class="cit"><a href="#ref-27">27</a></sup></td><td>20B</td><td>1024</td><td>91.3</td><td>91.6</td><td>92.0</td><td>94.3</td><td>92.7</td><td>88.3</td></tr>
<tr><td>PixNerd-XXL/16<sup class="cit"><a href="#ref-10">10</a></sup></td><td>1.2B</td><td>512</td><td>80.5</td><td>87.9</td><td>87.2</td><td>91.3</td><td>72.8</td><td>80.9</td></tr>
<tr><td>PixelDiT<sup class="cit"><a href="#ref-12">12</a></sup></td><td>1.3B</td><td>512</td><td>88.0</td><td>90.9</td><td>87.6</td><td>89.8</td><td>88.5</td><td>83.7</td></tr>
<tr><td>PixelGen-XXL/16<sup class="cit"><a href="#ref-19">19</a></sup></td><td>1.1B</td><td>512</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td></tr>
<tr><td>DeCo-XXL/16<sup class="cit"><a href="#ref-11">11</a></sup></td><td>1.1B</td><td>512</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td>81.4</td></tr>
<tr><td>RG-T2I-L/16<sup class="cit"><a href="#ref-28">28</a></sup></td><td>0.9B</td><td>512</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td>87.1</td></tr>
<tr><td>MiniT2I-L/16<sup class="cit"><a href="#ref-29">29</a></sup></td><td>0.9B</td><td>512</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td>85.9</td></tr>
<tr><td>PixelFlow-XL/4<sup class="cit"><a href="#ref-30">30</a></sup></td><td>0.9B</td><td>512</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td>77.9</td></tr>
<tr><td>Iris<sup class="cit"><a href="#ref-31">31</a></sup></td><td>3B</td><td>1024</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td><td>86.5</td></tr>
<tr><td>Tuna-2<sup class="cit"><a href="#ref-32">32</a></sup></td><td>7B</td><td>1024</td><td>89.5</td><td>91.4</td><td>92.1</td><td>91.9</td><td>88.8</td><td>86.5</td></tr>
<tr class="ours"><td>Detour</td><td>3.3B</td><td>512</td><td>85.3</td><td>92.5</td><td>90.7</td><td>94.9</td><td>85.7</td><td>87.8</td></tr>
<tr class="ours"><td>Detour</td><td>3.3B</td><td>1024</td><td>85.3</td><td>92.3</td><td>90.4</td><td>94.9</td><td>85.9</td><td>87.4</td></tr>
</tbody></table></div>
<p class="dt-cap">DPG-Bench. Baselines are from the original papers or from Tuna-2, SANA, Janus-Pro and Qwen-Image.</p>
</div>

The GenEval per-task breakdown is where the path shows itself. Counting (0.83) and position (0.86) are
the two tasks that need the layout settled before any texture is drawn, and they are exactly where
pixel-space models fall down — PixNerd scores 0.44 on counting, PixelDiT 0.53 on position. Deciding
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

The default code is DINOv2-B with 768 channels, chosen because that is exactly a 16&times;16&times;3 pixel
patch: the pixel shuffle $$\Phi$$ maps the code into an RGB-shaped state without changing its dimension
or its norm. Two questions follow — what happens when the encoder's width does not match, and does the
choice of encoder matter at all? All runs below are JiT-B/16 on ImageNet 256 for 80 epochs, unguided,
with the same sampler: relative comparisons, not best achievable numbers.

<figure class="detour-fig">
  <img src="{{ '/assets/img/detour/codedim.jpg' | relative_url }}" data-zoomable data-zoom-src="{{ '/assets/img/detour/full/codedim.jpg' | relative_url }}" alt="Code dimension and encoder ablations" />
  <figcaption>Unguided FID-10k during training. Left: projecting a 1024-channel DINOv2-L code down to 768 against padding the state to four channels. Right: three different encoders at the same 768 channels.</figcaption>
</figure>

<div class="dt-wrap"><div class="dt-scroll">
<table class="dt">
<thead>
<tr><th>Encoder</th><th>Adaptation</th><th>$$C$$</th><th>State</th><th>$$R^2$$</th><th>FID-50k</th></tr>
</thead><tbody>
<tr><td>DINOv2-B</td><td><span class="u">&ndash;</span></td><td>768</td><td>3</td><td><span class="u">&ndash;</span></td><td>16.85</td></tr>
<tr class="ours"><td>DINOv2-L</td><td>project</td><td>768</td><td>3</td><td>0.682</td><td>15.01</td></tr>
<tr><td>DINOv2-L</td><td>pad</td><td>1024</td><td>4</td><td><span class="u">&ndash;</span></td><td>17.39</td></tr>
<tr class="sec"><td colspan="6">Other encoders, same 768-channel interface</td></tr>
<tr><td>MAE<sup class="cit"><a href="#ref-33">33</a></sup></td><td><span class="u">&ndash;</span></td><td>768</td><td>3</td><td>0.916</td><td>22.77</td></tr>
<tr><td>LeJEPA<sup class="cit"><a href="#ref-34">34</a></sup></td><td><span class="u">&ndash;</span></td><td>768</td><td>3</td><td>0.793</td><td>23.05</td></tr>
</tbody></table></div>
<p class="dt-cap">$$R^2$$ is linear patch reconstruction from the code token, estimated from 1.03M tokens.</p>
</div>

**Projecting beats padding.** DINOv2-L has 1024 channels, which pixel shuffle turns into a four-channel
state — and the fourth channel has no clean image behind it, only code. Projecting down to 768 instead
keeps the three-channel state and the unmodified pixel-space architecture, and wins by 2.4 FID-50k
(15.01 against 17.39) while retaining 94.7% of the feature variance. The projection is PCA followed by
a fixed orthogonal rotation, which balances the channel variances so that pixel shuffle spreads them
evenly across the three RGB planes rather than concentrating them in one. Keeping the state shaped like
an image matters more than keeping every direction of the feature.

**The encoder is not interchangeable.** Swapping DINOv2 for MAE or LeJEPA at the same 768 channels and
the same architecture costs about 8 FID-50k, and both alternatives converge more slowly throughout
training (figure, right — they are still at 26.0 FID-10k at epoch 80, where DINOv2 is at 18.1).

The obvious explanation does not survive. *Pixel predictability* — how well a linear ridge regressor
reconstructs a patch from its code — is **highest for MAE** ($$R^2$$ 0.916, against 0.682 for projected
DINOv2-L), and MAE generates worst. Easier reconstruction does not mean easier generation. What
separates the encoders is the semantic structure of the representation itself, which is the thing the
detour path actually travels along.

## Code feedback

The sampler already predicts a code at every step, and then throws it away. Feeding it back — in the
manner of self-conditioning<sup class="cit"><a href="#ref-35">35</a></sup> — costs almost nothing and is the single largest unguided gain we found.

A zero-initialised linear layer projects the previous step's predicted code to the trunk width and adds
it to the input patch tokens; the first step gets zeros. Training needs a gradient-free first pass to
produce the feedback for half of each batch, about **25% more training time**. Sampling needs **no
extra network evaluations** at all, since the previous prediction is already in hand. Under CFG the
conditional and unconditional branches keep separate feedback codes.

<figure class="detour-fig">
  <img src="{{ '/assets/img/detour/feedback_arch.jpg' | relative_url }}" data-zoomable data-zoom-src="{{ '/assets/img/detour/full/feedback_arch.jpg' | relative_url }}" alt="Code feedback architecture" />
  <figcaption>(a) The previous code prediction is projected into the trunk input. (b) Training uses a gradient-free first pass to provide feedback for half the batch. (c) Sampling reuses the previous prediction with no extra evaluations.</figcaption>
</figure>

<div class="dt-wrap"><div class="dt-scroll">
<table class="dt">
<thead>
<tr><th>Model (JiT-B)</th><th>20 ep.</th><th>40 ep.</th><th>60 ep.</th><th>80 ep.</th></tr>
</thead><tbody>
<tr><td>Pixel flow + feedback</td><td>47.9</td><td>24.7</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td></tr>
<tr><td>Detour + feedback, last-layer code</td><td>21.6</td><td>13.2</td><td><span class="u">&ndash;</span></td><td><span class="u">&ndash;</span></td></tr>
<tr class="sec"><td colspan="5">Multi-layer code</td></tr>
<tr><td>Detour</td><td>38.2</td><td>24.6</td><td>20.5</td><td>18.4</td></tr>
<tr class="ours"><td>Detour + feedback</td><td>18.6</td><td>11.2</td><td>9.1</td><td>7.98</td></tr>
</tbody></table></div>
<p class="dt-cap">Unguided FID-10k, Heun 50 on the power-2 grid.</p>
</div>

At base scale feedback **halves FID-10k** — 38.2 to 18.6 at 20 epochs, 18.4 to 7.98 at 80. It helps
plain pixel flow too, but the detour path still wins under the same mechanism (21.6 against 47.9 at
20 epochs), so the gain is not simply self-conditioning wearing a different hat.

<figure class="detour-fig">
  <img src="{{ '/assets/img/detour/feedback_conv.jpg' | relative_url }}" data-zoomable data-zoom-src="{{ '/assets/img/detour/full/feedback_conv.jpg' | relative_url }}" alt="Code feedback accelerates unguided convergence" />
  <figcaption>Unguided FID-10k during training, at both model sizes.</figcaption>
</figure>

It scales. At XL, feedback roughly halves FID-10k at epoch 20 (16.5 → 8.36), and by **epoch 40 it has
already passed the 200-epoch model without feedback** (6.40 against 6.86). Unguided FID-50k at epoch 80
goes from 5.34 to 3.18.

### Why it is not in the main models

<div class="dt-wrap"><div class="dt-scroll">
<table class="dt">
<thead>
<tr><th>Detour-XL/16, epoch 80</th><th>Guidance</th><th>FID-10k</th><th>FID-50k</th><th>IS</th></tr>
</thead><tbody>
<tr><td>Detour</td><td>none</td><td>8.06</td><td>5.34</td><td>157</td></tr>
<tr><td></td><td>CFG 2.25</td><td><span class="u">&ndash;</span></td><td>2.75</td><td>269</td></tr>
<tr class="ours"><td></td><td>CFG 1.75 + AG 2.0</td><td>4.42</td><td>1.87</td><td>248</td></tr>
<tr class="sec"><td colspan="5">With code feedback</td></tr>
<tr><td>+ feedback</td><td>none</td><td>5.70</td><td>3.18</td><td>234</td></tr>
<tr><td></td><td>CFG 1.25</td><td>5.66</td><td>3.12</td><td>239</td></tr>
<tr><td></td><td>AG 2.5</td><td>4.60</td><td>2.09</td><td>250</td></tr>
<tr><td></td><td>CFG 1.125 + AG 2.5</td><td>4.63</td><td>2.12</td><td>260</td></tr>
</tbody></table></div>
<p class="dt-cap">Guidance on [0.05, 0.9]; AutoGuidance uses each model's own epoch-20 checkpoint. IS on 50k samples.</p>
</div>

**The unguided gain does not survive guidance.** Feedback wins by 2.2 FID unguided and still loses
guided: 2.09 against 1.87. The clue is the Inception score — feedback reaches 234 *unguided*, where the
baseline needs CFG to get to 269, and then CFG buys it almost nothing (3.18 → 3.12 at its best scale).

A plausible reason is that feedback spoils its own weak model. AutoGuidance works by contrasting the
model against an undertrained copy of itself, and we use each model's epoch-20 checkpoint for that. A
feedback model at epoch 20 is *already good* — which is exactly what makes it a poor weak model. An
earlier checkpoint might restore the gap, but we have not tried it, so feedback stays out of the main
XL models despite the convergence it buys.

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

## References

<ol class="dt-refs">
<li id="ref-1">Oquab et al. <em>Dinov2: Learning robust visual features without supervision</em>. arXiv preprint, 2023. <a href="https://arxiv.org/abs/2304.07193">arXiv:2304.07193</a></li>
<li id="ref-2">Ho and Salimans. <em>Classifier-free diffusion guidance</em>. arXiv preprint, 2022. <a href="https://arxiv.org/abs/2207.12598">arXiv:2207.12598</a></li>
<li id="ref-3">Karras et al. <em>Guiding a diffusion model with a bad version of itself</em>. Advances in Neural Information Processing Systems, 2024.</li>
<li id="ref-4">Peebles and Xie. <em>Scalable diffusion models with transformers</em>. 2023 IEEE/CVF International Conference on Computer Vision (ICCV), 2023.</li>
<li id="ref-5">Yu et al. <em>Representation alignment for generation: Training diffusion transformers is easier than you think</em>. arXiv preprint, 2024. <a href="https://arxiv.org/abs/2410.06940">arXiv:2410.06940</a></li>
<li id="ref-6">Yao et al. <em>Reconstruction vs. generation: Taming optimization dilemma in latent diffusion models</em>. 2025 IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR), 2025.</li>
<li id="ref-7">Zheng et al. <em>Diffusion transformers with representation autoencoders</em>. International Conference on Learning Representations, 2026.</li>
<li id="ref-8">Dhariwal and Nichol. <em>Diffusion models beat gans on image synthesis</em>. Advances in neural information processing systems, 2021.</li>
<li id="ref-9">Hoogeboom et al. <em>Simpler diffusion: 1.5 fid on imagenet512 with pixel-space diffusion</em>. 2025 IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR), 2025.</li>
<li id="ref-10">Wang et al. <em>PixNerd: Pixel neural field diffusion</em>. International Conference on Learning Representations, 2026.</li>
<li id="ref-11">Ma et al. <em>Deco: Frequency-decoupled pixel diffusion for end-to-end image generation</em>. Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition, 2026.</li>
<li id="ref-12">Yu et al. <em>Pixeldit: Pixel diffusion transformers for image generation</em>. Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition, 2026.</li>
<li id="ref-13">Li and He. <em>Back to basics: Let denoising generative models denoise</em>. Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition, 2026.</li>
<li id="ref-14">Shin et al. <em>Representation alignment for just image transformers is not easier than you think</em>. European Conference on Computer Vision, 2026.</li>
<li id="ref-15">Yu et al. <em>PixelDiT2: Representation-Grounded Pixel Diffusion Transformers</em>. arXiv preprint, 2026. <a href="https://arxiv.org/abs/2609.24919">arXiv:2609.24919</a></li>
<li id="ref-16">You et al. <em>Advanced Pixel Diffusion Model with Guided Sparse Global Refinement</em>. arXiv preprint, 2026. <a href="https://arxiv.org/abs/2609.00798">arXiv:2609.00798</a></li>
<li id="ref-17">Baade et al. <em>Latent forcing: Reordering the diffusion trajectory for pixel-space image generation</em>. arXiv preprint, 2026. <a href="https://arxiv.org/abs/2602.11401">arXiv:2602.11401</a></li>
<li id="ref-18">Ghosh et al. <em>Dino Forcing Flow Models: Do not denoise what you can predict</em>. arXiv preprint, 2026. <a href="https://arxiv.org/abs/2610.11751">arXiv:2610.11751</a></li>
<li id="ref-19">Ma et al. <em>PixelGen: Improving pixel diffusion with perceptual supervision</em>. arXiv preprint, 2026. <a href="https://arxiv.org/abs/2602.02493">arXiv:2602.02493</a></li>
<li id="ref-20">Karras et al. <em>Analyzing and improving the training dynamics of diffusion models</em>. 2024 IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR), 2024.</li>
<li id="ref-21">Pavasovic et al. <em>WaiT for the Signal: Simple Frequency-Aware Flow-Matching</em>. arXiv preprint, 2026. <a href="https://arxiv.org/abs/2607.28760">arXiv:2607.28760</a></li>
<li id="ref-22">Esser et al. <em>Scaling rectified flow transformers for high-resolution image synthesis</em>. Forty-first international conference on machine learning, 2024.</li>
<li id="ref-23">Labs et al. <em>FLUX.1 Kontext: Flow Matching for In-Context Image Generation and Editing in Latent Space</em>. arXiv preprint, 2025. <a href="https://arxiv.org/abs/2506.15742">arXiv:2506.15742</a></li>
<li id="ref-24">Xie et al. <em>Sana: Efficient high-resolution image synthesis with linear diffusion transformer, 2024</em>. URL https://arxiv. org/abs/2410.10629, .</li>
<li id="ref-25">Qin et al. <em>Lumina-image 2.0: A unified and efficient image generative framework</em>. 2025 IEEE/CVF International Conference on Computer Vision (ICCV), 2025.</li>
<li id="ref-26">Cai et al. <em>Z-image: An efficient image generation foundation model with single-stream diffusion transformer</em>. arXiv preprint, 2025. <a href="https://arxiv.org/abs/2511.22699">arXiv:2511.22699</a></li>
<li id="ref-27">Wu et al. <em>Qwen-image technical report</em>. arXiv preprint, 2025. <a href="https://arxiv.org/abs/2508.02324">arXiv:2508.02324</a></li>
<li id="ref-28">Pan et al. <em>Learning Representations to Guide Pixel Diffusion Transformers</em>. arXiv preprint, 2026. <a href="https://arxiv.org/abs/2610.12978">arXiv:2610.12978</a></li>
<li id="ref-29">Wang et al. <em>MiniT2I: A minimalist baseline for text-to-image generation</em>. 2026. <a href="https://peppaking8.github.io/#/post/minit2i">peppaking8.github.io</a></li>
<li id="ref-30">Chen et al. <em>Pixelflow: Pixel-space generative models with flow</em>. arXiv preprint, 2025. <a href="https://arxiv.org/abs/2504.07963">arXiv:2504.07963</a></li>
<li id="ref-31">Cai and Garabito. <em>Iris-3B: Going Beyond the Latent with Pixel-Space Diffusion Training, Conversion and Fine-Tuning</em>. arXiv preprint, 2026. <a href="https://arxiv.org/abs/2610.09450">arXiv:2610.09450</a></li>
<li id="ref-32">Liu et al. <em>Tuna-2: Pixel embeddings beat vision encoders for multimodal understanding and generation</em>. arXiv preprint, 2026. <a href="https://arxiv.org/abs/2604.24763">arXiv:2604.24763</a></li>
<li id="ref-33">He et al. <em>Masked autoencoders are scalable vision learners</em>. 2022 IEEE/CVF conference on computer vision and pattern recognition (CVPR), 2022.</li>
<li id="ref-34">Balestriero and LeCun. <em>Lejepa: Provable and scalable self-supervised learning without the heuristics</em>. arXiv preprint, 2025. <a href="https://arxiv.org/abs/2511.08544">arXiv:2511.08544</a></li>
<li id="ref-35">Chen et al. <em>Analog Bits: Generating Discrete Data using Diffusion Models with Self-Conditioning</em>. arXiv preprint, 2023. <a href="https://arxiv.org/abs/2208.04202">arXiv:2208.04202</a></li>
</ol>
