---
layout: post
date: 2025-1-22 15:59:00-0400
inline: true
related_posts: false
---

:zap: [Improved Latent Consistency Model](https://openreview.net/forum?id=PQjZes6vFV) got accepted at ICLR 2025. This paper proposes series of novel techniques like Cauchy loss, OT coupling, adaptive robust scale scheduler and diff loss at early timestep to efficiently train latent consistency model from scatch. Our technique bridges the performance gap between LDM and LCM training. (this is the first work discovering the unstability of consistency model on latent space due to impulsive outlier.)