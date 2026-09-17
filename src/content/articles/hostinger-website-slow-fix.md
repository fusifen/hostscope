---
title: "Why Your Hostinger Site Is Slow: 12 Fixes That Work"
description: "Twelve fixes for a slow Hostinger site, in priority order, from the built-in CDN and LiteSpeed Cache to PHP version, images, database bloat and plan limits."
pubDate: 2026-01-22
updatedDate: 2026-09-16
author: "daniel-okafor"
category: "troubleshooting"
tags: ['hostinger slow', 'website speed', 'litespeed cache', 'wordpress performance']
primaryKeyword: "hostinger slow website"
affiliateNotice: true
featured: false
readingTime: 9
relatedPlans: ['premium', 'unlimited', 'cloud-startup']
relatedArticles: ['fix-hostinger-503-error', 'fix-wordpress-white-screen-hostinger', 'fix-error-establishing-database-connection-hostinger']
faqs:
  - question: "Why is my Hostinger website so slow?"
    answer: >-
      The usual causes in order are an uncached WordPress install, no CDN, an
      old PHP version, unoptimised images, too many plugins, a bloated database
      and finally plan resources. Work through them in that order, because the
      first four are free to fix.
  - question: "Does Hostinger have a built-in CDN?"
    answer: >-
      Yes. Every web hosting plan includes a CDN that can be switched on from
      hPanel. It serves static assets from edge locations instead of your origin
      server, which cuts latency for visitors far from your data center.
  - question: "Which PHP version should I use on Hostinger?"
    answer: >-
      The newest version your site supports. Newer PHP releases are meaningfully
      faster and receive security updates. Test on a staging copy first, because
      an old plugin can break on a major version change.
  - question: "Is LiteSpeed Cache better than other caching plugins?"
    answer: >-
      On Hostinger, yes. Hostinger runs the LiteSpeed web server, and the
      LiteSpeed Cache plugin can use server-level caching rather than
      file-based caching. That means cached pages are served without invoking
      PHP at all.
  - question: "How many plugins are too many for a Hostinger plan?"
    answer: >-
      There is no hard limit, but most well-built sites run under about 15
      active plugins. Past that, every request carries more code, and on a
      1-core Premium plan the effect is measurable.
  - question: "Will upgrading my plan make my site faster?"
    answer: >-
      Only if you have already fixed the software side. A cached, image-optimised
      site on Premium is faster than an uncached site on Cloud Startup. Upgrade
      when your resource graph shows you saturating the plan on normal days.
---

## Measure before you change anything

Slow is not a diagnosis. Before you touch a setting, find out which part is slow.

Open your browser's developer tools, go to the Network tab, and reload the page.
Look at two numbers: **time to first byte** and **total load time**.

- If time to first byte is high — above roughly 600 ms — the problem is on the
  server: PHP, the database, caching or plan resources.
- If time to first byte is low but total load time is high, the problem is in the
  assets: images, scripts, fonts or CSS.

Those two failures have completely different fixes, and guessing between them is
how people waste a weekend. Run the test, note the numbers, then work down this
list in order. The fixes are ordered by impact per unit of effort, not by how
interesting they are.

> The first four fixes on this list are free and typically recover more speed
> than everything after them combined. Do not skip to the upgrade until you have
> done them.

## The 12 fixes, in priority order

### 1. Turn on the built-in CDN

Every Hostinger web hosting plan includes a CDN, and it is off until you enable
it. In hPanel, open the website's management area and look for the CDN setting —
it is normally a single toggle.

A CDN caches your static assets at edge locations around the world. A visitor in
Sydney hitting a data center in Arizona stops waiting for images to cross the
Pacific. This is the highest-impact change available and it takes about a minute.

### 2. Install LiteSpeed Cache and configure it properly

Hostinger runs the LiteSpeed web server, and the LiteSpeed Cache plugin for
WordPress can hook into server-level caching. That is qualitatively better than
file-based caching: a cached page is served without starting PHP, so it never
occupies a PHP worker.

Installing it is not enough. Configure it:

- **Enable page caching.** This is the whole point.
- **Enable browser caching** for static assets.
- **Enable CSS and JS minification** — but test after, because aggressive
  combining breaks some themes.
- **Enable lazy loading** for images below the fold.
- **Purge the cache** after every content or plugin change, or you will debug a
  problem that no longer exists.
- **Exclude cart, checkout and account pages** from caching if you run
  WooCommerce. Caching a cart page serves one customer's cart to another.

### 3. Pick the right PHP version

PHP gets faster with each major release, and old versions stop receiving
security patches. In hPanel, the site's PHP configuration area lets you select
the version.

Move to the newest version your site supports. Test on a staging copy or a
backup first — a plugin written for an older PHP release can throw fatal errors
on a newer one. If you see a white screen after the switch, that is what
happened, and the [white screen guide](/blog/fix-wordpress-white-screen-hostinger/)
walks through the recovery.

### 4. Enable OPcache

OPcache stores compiled PHP bytecode in memory so that each request does not
recompile the same files. On a WordPress site this is usually a double-digit
percentage improvement in time to first byte, for free.

It is a PHP setting rather than a plugin. In hPanel's PHP configuration area,
look for OPcache and enable it. If it is already on, leave it — but check that
the memory allocation is not set absurdly low.

### 5. Compress and resize images

Images are the most common cause of a slow total load time. A 4 MB hero image
straight from a camera will undo every server-side optimisation you made.

- Resize to the largest size actually displayed. A 4000 px image in a 800 px
  slot is wasting 90% of its bytes.
- Convert to WebP or AVIF where the theme supports it.
- Compress to a sensible quality — 75–82% is usually indistinguishable.
- Serve responsive sizes so phones do not download desktop images.
- Lazy-load everything below the fold.

### 6. Cut the plugin count

Every active plugin adds code to every request. On a Premium plan with 1 CPU
core and 2 GB RAM, the difference between 12 and 30 plugins is visible in the
resource graph.

Go through the plugin list and ask of each one: does this earn its place? Merge
overlapping plugins. Delete deactivated plugins rather than leaving them
installed — they still occupy inodes and sometimes still load.

### 7. Confirm your storage type

Hostinger's plans are not all on the same storage. **Premium uses 20 GB SSD.**
**Unlimited uses 50 GB NVMe**, and Cloud Startup uses 100 GB NVMe. NVMe is
substantially faster for random I/O, which is exactly the access pattern a
database-heavy WordPress site generates.

If you are on Premium and everything else on this list is done, the storage tier
is part of your ceiling. It is one of the concrete differences between the two
lower tiers, and it is not something you can configure your way around.

### 8. Clean the database and cap revisions

WordPress stores every post revision forever by default. A site that has been
edited for three years can carry thousands of revision rows that no one will
ever look at, all of them inflating queries.

- Cap revisions in `wp-config.php` by setting a limit, so old revisions are not
  retained indefinitely.
- Delete spam comments and expired transients.
- Clean orphaned post meta left behind by deleted plugins.
- Optimise the tables afterwards.

Database size limits are 3 GB on Premium and Unlimited, and 6 GB on Cloud
Startup, so a bloated database can eventually hit a hard wall as well as a
performance one.

### 9. Audit third-party scripts

Open the Network tab again and sort by size and by time. Third-party scripts —
analytics, chat widgets, ad pixels, embedded videos, font loaders — are usually
the heaviest things on the page and you control none of them.

For each one, ask whether it earns its weight. A chat widget that nobody uses
can cost a second of load time. A font loaded from a third-party CDN adds a DNS
lookup and a connection. Self-hosting fonts and deferring non-critical scripts
are cheap wins.

### 10. Enable compression and modern protocols

LiteSpeed supports Brotli and Gzip compression and HTTP/3. Compression typically
cuts text asset sizes by 60–80%. HTTP/3 reduces connection setup time on mobile
networks.

Both are server-side settings. Compression is usually on by default in LiteSpeed
but worth verifying. If you are on a CDN, check that the CDN is not stripping the
compression headers.

### 11. Fix the slow query

If the resource graph shows high CPU but normal memory and the page is slow even
when cached, look at the database. A plugin running an unindexed query on every
page load will pin one CPU core on its own.

Enable query logging temporarily, find the slowest query, and work out which
plugin issues it. Sometimes the fix is removing the plugin; sometimes it is
adding an index or enabling an object cache.

### 12. Accept the resource ceiling

If you have done all of the above and the site is still slow under load, you are
at the plan ceiling. That is a legitimate answer, not a failure.

| Plan | CPU cores | RAM | Storage | PHP workers | Memory limit |
| --- | --- | --- | --- | --- | --- |
| Premium | 1 | 2 GB | 20 GB SSD | 40 | 1,536 MB |
| Unlimited | 2 | 3 GB | 50 GB NVMe | 60 | 2,048 MB |
| Cloud Startup | 4 | 4 GB | 100 GB NVMe | 100 | 3,072 MB |
| Cloud Professional | 5 | 6 GB | 200 GB NVMe | 200 | 6,144 MB |

Going from Premium to Unlimited costs $1/mo more on the 48-month term and doubles
your CPU, adds 50% more RAM, moves you to NVMe and raises PHP workers from 40 to
60. That is the single most common upgrade we recommend, and it is covered in
detail on the [Unlimited plan page](/plans/unlimited/).

## Symptom to cause to fix

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| High time to first byte, low CPU | No page caching | Install and configure LiteSpeed Cache |
| Slow for overseas visitors only | No CDN | Enable the built-in CDN in hPanel |
| Slow on every page including static | Old PHP version, no OPcache | Update PHP, enable OPcache |
| Fast HTML, slow full load | Unoptimised images and third-party scripts | Compress images, defer scripts |
| Slow admin, fine front end | Plugin bloat, database revisions | Trim plugins, cap revisions |
| Slow in the afternoon, fine at night | Resource ceiling under peak | Upgrade the plan |
| Random slowness, no pattern | Bot traffic or a runaway plugin | Check access logs, disable plugins in bulk |
| Slow database-driven pages only | Missing index or object cache | Profile queries, add caching |
| 503 rather than slow | PHP worker exhaustion | See the [503 error guide](/blog/fix-hostinger-503-error/) |

## A sensible order of work

1. Enable the CDN.
2. Install and configure LiteSpeed Cache.
3. Update PHP and enable OPcache.
4. Compress and resize images.
5. Trim plugins.
6. Clean the database.
7. Audit third-party scripts.
8. Re-measure. Only then consider hardware.

Re-measure after each step rather than doing everything at once. If you change
five things and the site gets faster, you have no idea which change mattered —
and no idea what to do next time. The [hosting cost calculator](/tools/hosting-cost-calculator/)
will help you judge whether the upgrade is worth the money against the
[current pricing](/pricing/), and the
[Unlimited plan breakdown](/plans/unlimited/) shows exactly what changes at the
next tier up.
