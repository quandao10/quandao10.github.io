---
layout: page
permalink: /publications/
title: publications
description: Here is my selected publication. See more in my [google scholar](https://scholar.google.com/citations?user=g0RS3_kAAAAJ&hl=en&oi=sra)
years: [2023]
nav: true
nav_order: 1
---
<!-- _pages/publications.md -->
<div class="publications">

{%- for y in page.years %}
  <h2 class="year">{{y}}</h2>
  {% bibliography -f {{ site.scholar.bibliography }} -q @*[year={{y}}]* %}
{% endfor %}

</div>
