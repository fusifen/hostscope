---
title: "Hostinger Uptime and Speed: What the Numbers Actually Look Like"
description: "What 99.9% uptime really allows, how LiteSpeed, LSCache, the CDN and NVMe storage affect TTFB, and which Hostinger plan tiers hit their resource ceiling first."
pubDate: 2026-05-06
updatedDate: 2026-09-16
author: "daniel-okafor"
category: "review"
tags: ['hostinger uptime', 'hostinger speed', 'litespeed', 'performance', 'vps']
primaryKeyword: "hostinger uptime"
affiliateNotice: true
featured: false
readingTime: 8
rating: 4.5
relatedPlans: ['unlimited', 'cloud-startup', 'kvm-2']
relatedArticles: ['hostinger-review', 'is-hostinger-good', 'shared-vs-cloud-vs-vps-hosting']
faqs:
  - question: "Does Hostinger have 99.9% uptime?"
    answer: >-
      That is the published commitment. 99.9% allows roughly 43 minutes of downtime in a 30-day month. In our tracking of a WordPress site on the Unlimited plan, uptime stayed within that commitment, but we did record short incidents rather than a perfect record.
  - question: "Is Hostinger fast?"
    answer: >-
      A properly cached WordPress site on LiteSpeed with LSCache and the built-in CDN serves quickly — time to first byte typically in the low hundreds of milliseconds from a nearby data center. Uncached, or on the cheapest tier under load, it is a different story.
  - question: "What is the difference between SSD and NVMe on Hostinger?"
    answer: >-
      Premium runs on 20 GB SSD. Unlimited moves to 50 GB NVMe and Cloud Startup to 100 GB NVMe. NVMe has much higher throughput and lower latency, which matters most for database-heavy sites like WooCommerce.
  - question: "Why is my Hostinger site slow?"
    answer: >-
      The usual causes, in order: no caching plugin enabled, too many heavy plugins, a page builder generating large CSS and JavaScript, and CPU or PHP worker exhaustion during peak hours. Check the error log for 503s first — that points at resources rather than configuration.
  - question: "Which Hostinger plan hits its limits first?"
    answer: >-
      Premium, and it is not close. One CPU core and 40 PHP workers is the smallest budget in the lineup. Unlimited doubles both. Cloud Startup doubles them again and adds NVMe storage.
  - question: "Is Hostinger good for a high-traffic site?"
    answer: >-
      Not on web hosting. Shared CPU means a neighbour's traffic spike can affect your response times, and you cannot tune the server. Past roughly 100,000 monthly pageviews, a KVM VPS gives you isolation and control that shared plans cannot.
---

## The headline numbers, and what they do not tell you

Hostinger publishes a 99.9% uptime commitment across its plans. Read that carefully, because the number sounds better than it is.

99.9% uptime allows about 43 minutes of downtime in a 30-day month, or roughly 8.7 hours a year. That is the commitment. It is a normal, industry-standard figure — not a bad one, not an exceptional one.

What a commitment cannot tell you is how the downtime is distributed. One 40-minute outage and forty one-minute blips have the same effect on the annual percentage and completely different effects on your visitors and your search rankings. That is why monitoring matters more than the marketing figure.

> **Methodology note:** the observations below come from a synthetic monitor checking a WordPress site on the Unlimited plan every 60 seconds from multiple regions, alongside spot checks on Cloud Startup and a KVM 2 VPS. This is a single-site sample, not a benchmark suite. Results vary substantially by data center, theme, plugin load and time of day, and your numbers will differ.

## How we looked at it

We kept the methodology deliberately boring, because boring is what makes performance numbers comparable.

- **Uptime:** an external monitor requesting the homepage every 60 seconds, recording HTTP status and total response time. Downtime counted as any non-2xx response or a timeout over 30 seconds.
- **TTFB:** time to first byte measured from a fixed set of regions against both a cached and an uncached page.
- **Load testing:** a small concurrent-request ramp against a cached page to find the point where response times started climbing rather than staying flat.

What we did not do: benchmark against competitors on identical hardware, or test every data center. Both would be useful and neither is what a buyer needs. What a buyer needs is an honest sense of the shape of the performance, and where it breaks. Our [testing methodology](/how-we-test/) explains the general approach we use across the site.

## What 99.9% means in practice

In our tracking, the WordPress site on the Unlimited plan stayed within the 99.9% commitment. We recorded short incidents — the kind that show up as a single failed check or two — rather than a clean sheet, and we did not record a multi-hour outage.

Two caveats that apply to any shared host:

1. **Your experience is partly your neighbours'.** On shared infrastructure, another account on the same node can consume CPU and I/O in ways you cannot see or control. Hostinger isolates accounts to a point, but the physical machine is shared.
2. **Uptime is measured at the host, not at your visitor.** A site can be "up" and still be unusable because PHP workers are exhausted and requests are queuing. That shows as slow, not down — and most uptime monitors will not catch it.

## The speed stack, in order of impact

### LiteSpeed and LSCache

Hostinger runs LiteSpeed as the web server rather than Apache. For WordPress, the practical difference is the LSCache plugin, which serves cached pages from the server level rather than rebuilding them in PHP on every request.

This is the single largest performance lever you control. A cached page skips PHP execution and most database queries entirely. In our tests the gap between a cached and an uncached page was far bigger than any difference between plan tiers — an uncached Premium page can easily be slower than a cached Unlimited page.

### The built-in CDN

Every plan includes a CDN, with Cloudflare-protected nameservers. Static assets — images, CSS, JavaScript, fonts — are served from an edge location near the visitor instead of from the origin server.

The effect is largest for visitors far from your data center. Hostinger's regions include North America (Arizona, Massachusetts, New York), South America (Brazil), Europe (Lithuania, Netherlands, France, UK), South Africa, Asia (India, Indonesia, Singapore) and Australia. Pick the region closest to your audience and the CDN covers the rest.

### NVMe versus SSD

This is the spec most people skim past, and it is a genuine tier difference:

| Plan | Storage | Type |
| --- | --- | --- |
| Premium | 20 GB | SSD |
| Unlimited | 50 GB | NVMe |
| Cloud Startup | 100 GB | NVMe |
| KVM 1–8 | 50–400 GB | NVMe SSD |

NVMe drives have dramatically higher throughput and lower latency than SATA SSDs. For a static blog, the difference is modest. For WooCommerce, where every page view can mean dozens of database reads, it is noticeable — and it is one of the few upgrade reasons that is about speed rather than capacity.

### PHP workers, the ceiling nobody talks about

Each plan has a fixed number of PHP workers, which is your real concurrency budget:

| Plan | CPU cores | RAM | PHP workers | PHP memory limit |
| --- | --- | --- | --- | --- |
| Premium | 1 | 2 GB | 40 | 1,536 MB |
| Unlimited | 2 | 3 GB | 60 | 2,048 MB |
| Cloud Startup | 4 | 4 GB | 100 | 3,072 MB |
| Cloud Professional | 5 | 6 GB | 200 | 6,144 MB |
| Cloud Enterprise | 6 | 12 GB | 300 | 12,288 MB |

When all workers are busy, new requests wait. That is the queue you feel as "the site got slow at 3pm". It is not a crash and it will not show in an uptime report.

## Which tiers hit the ceiling first

**Premium hits it first, by a wide margin.** One core, 2 GB RAM and 40 PHP workers is a small budget. On a cached site with a lightweight theme it will handle a modest blog comfortably. Add a page builder, WooCommerce, several plugins and any kind of traffic spike and you will see response times climb, then 503 errors.

**Unlimited is the sensible middle.** Doubling to 2 cores and 60 PHP workers does not make it a performance plan, but it moves the ceiling far enough that a small business site or a light store rarely touches it — see the [Unlimited plan specs](/plans/unlimited/) for the full limit table.

**Cloud Startup is where shared hosting stops feeling shared.** Four cores, 100 PHP workers, NVMe and a 3,072 MB PHP memory limit. The jump in concurrency headroom from Unlimited is roughly 1.7x on workers and 2x on cores.

**Cloud Professional and Enterprise are for concurrency, not raw speed.** A single cached page will not serve noticeably faster on Enterprise than on Startup. What changes is how many simultaneous uncached requests you can absorb before things degrade.

**VPS removes the ceiling entirely, and adds a new problem.** A KVM 2 with 2 vCPU cores, 8 GB RAM, 100 GB NVMe and 300 MB/s I/O is not shared with anyone. But it is self-managed, and an untuned VPS running a default stack can easily be slower than a well-configured shared plan. You are trading a resource ceiling for an operations burden.

## A realistic expectation table

| Scenario | Expectation |
| --- | --- |
| Cached WordPress, Premium, steady traffic | TTFB typically low hundreds of milliseconds from a nearby region |
| Same site, uncached, afternoon peak | TTFB noticeably higher; the gap is often 2–5x |
| WooCommerce, Unlimited, moderate traffic | Workable, but cart and checkout requests are uncached and hit PHP every time |
| WooCommerce, Cloud Startup | Meaningfully more headroom; NVMe and 100 workers make checkout concurrency less painful |
| Any plan, traffic spike beyond worker count | Requests queue, then 503s. This is the failure mode to monitor for |

Treat all of those as directional. A lean theme on a cached site can beat those expectations; a heavy page builder with fifteen plugins can miss them badly.

## What to do about it

1. **Install and configure LSCache** if you are on WordPress. It is the highest-return five minutes of work available.
2. **Pick the right data center.** Choose the region nearest your audience at signup — changing later means a migration.
3. **Watch for 503s.** They are the clearest signal you have outgrown the plan. Hostinger's documentation points at CPU exhaustion as the leading cause.
4. **Move up before you need to.** The upgrade from Premium to Unlimited costs a dollar a month on the 48-month term and doubles your core count. If you are anywhere near the ceiling, that is cheap insurance.
5. **Consider a VPS when you need isolation.** If your problem is neighbours or tuning rather than raw capacity, [KVM 2](/plans/kvm-2/) is the answer, not a bigger shared plan.

The short version: Hostinger's speed comes from a genuinely good stack — LiteSpeed, LSCache, CDN, NVMe — and its limits come from a resource budget that is clearly tiered. Buy the tier that matches your concurrency, cache aggressively, and check [current plan specs](/pricing/) before you decide which one that is.
