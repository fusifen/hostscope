---
title: "How to Fix the Hostinger 503 Service Unavailable Error"
description: "A 503 on Hostinger is almost always resource exhaustion. Diagnose PHP workers, memory, plugins and bot floods, and know when to upgrade."
pubDate: 2026-02-06
updatedDate: 2026-09-16
author: "daniel-okafor"
category: "troubleshooting"
tags: ['hostinger 503 error', 'service unavailable', 'php workers', 'wordpress errors']
primaryKeyword: "hostinger 503 error"
affiliateNotice: true
featured: false
readingTime: 9
relatedPlans: ['premium', 'unlimited', 'cloud-startup']
relatedArticles: ['hostinger-website-slow-fix', 'fix-wordpress-white-screen-hostinger', 'fix-error-establishing-database-connection-hostinger']
steps:
  - name: "Check the resource usage graph"
    text: "Open hPanel, go to the website's management area and open the resource usage graph. Look at CPU, memory and entry processes over the last 24 hours. A flat-topped line means you hit a ceiling rather than a spike."
  - name: "Check whether it is only your site"
    text: "Load a static file such as an image directly. If static files load but PHP pages do not, the web server is up and PHP is the bottleneck. If nothing loads, treat it as a platform issue and check Hostinger's status page."
  - name: "Read the access log for bot traffic"
    text: "Open the access log in hPanel's file manager or the logs section and look for repeated requests from the same IP or user agent. A single aggressive crawler can consume every PHP worker on a small plan."
  - name: "Turn off plugins to isolate the cause"
    text: "Rename the wp-content/plugins folder through the file manager to deactivate everything at once, then load the site. If it recovers, reactivate plugins one at a time to find the offender."
  - name: "Enable caching"
    text: "Install LiteSpeed Cache on WordPress and enable page caching, then enable the built-in CDN in hPanel. Cached pages are served without touching PHP, which removes load from the worker pool entirely."
  - name: "Raise the PHP memory limit if it is the constraint"
    text: "In the site's PHP configuration area in hPanel, raise the memory limit within the plan maximum — 1,536 MB on Premium, 2,048 MB on Unlimited, 3,072 MB on Cloud Startup."
  - name: "Upgrade if the ceiling is structural"
    text: "If the graph shows you saturating your plan most days, no configuration change will fix it. Premium has 40 PHP workers, Unlimited 60 and Cloud Startup 100. Moving up a tier is the fix."
faqs:
  - question: "Why does my Hostinger site show 503 Service Unavailable?"
    answer: >-
      In order of likelihood: you have exhausted your PHP worker allocation,
      a plugin or bot flood is consuming them, you hit the PHP memory limit, a
      PHP process has crashed, or there is a genuine platform incident.
  - question: "How many PHP workers does my Hostinger plan have?"
    answer: >-
      Premium has 40, Unlimited has 60 and Cloud Startup has 100. Cloud
      Professional has 200 and Cloud Enterprise has 300. Workers are the number
      of PHP requests that can run at once, so they are your real concurrency
      ceiling.
  - question: "Does 503 mean Hostinger is down?"
    answer: >-
      Usually not. A platform outage affects every site on the server, including
      static files. If images load but PHP pages return 503, the server is up
      and your site is the constraint.
  - question: "Will upgrading my plan fix the 503 error?"
    answer: >-
      It will if the cause is resource exhaustion, which it usually is. Check
      the resource graph first. If CPU and entry processes are pinned near the
      limit every day, upgrading is the correct fix rather than a workaround.
  - question: "Can a bot cause a 503 error?"
    answer: >-
      Yes. A crawler that ignores your robots file and requests thousands of
      pages per hour will consume every available PHP worker on a small plan.
      Blocking it in .htaccess or at the CDN layer usually resolves the error
      immediately.
  - question: "Does caching stop 503 errors?"
    answer: >-
      It reduces them substantially. A cached page is served without invoking
      PHP, so it does not occupy a worker. On a well-cached WordPress site the
      same plan can handle several times the traffic.
---

## What the 503 actually means

A 503 means the web server received your request and could not hand it to a
process that was free to handle it. The site is not gone and the files are not
missing. Something that should have answered your request was either busy,
crashed or out of room.

On Hostinger, that something is almost always PHP. Hostinger runs LiteSpeed, and
LiteSpeed serves each PHP request through a worker from a fixed pool. When every
worker is occupied, incoming requests queue. When the queue overflows, LiteSpeed
returns 503.

The fix is therefore not a single command. It is finding out which resource ran
out, then either reducing demand or raising the ceiling.

> The fastest triage test: load a static file — an image, a CSS file, a
> favicon — directly by URL. If static files load and PHP pages return 503, the
> server is healthy and your site is the bottleneck. If nothing loads at all,
> check Hostinger's status page before you touch anything.

## The causes, in order of likelihood

### 1. PHP worker exhaustion

This is the most common cause by a wide margin. Every plan comes with a fixed
number of PHP workers, and that number is your concurrency ceiling.

| Plan | PHP workers | PHP memory limit | CPU cores | RAM |
| --- | --- | --- | --- | --- |
| Premium | 40 | 1,536 MB | 1 | 2 GB |
| Unlimited | 60 | 2,048 MB | 2 | 3 GB |
| Cloud Startup | 100 | 3,072 MB | 4 | 4 GB |
| Cloud Professional | 200 | 6,144 MB | 5 | 6 GB |
| Cloud Enterprise | 300 | 12,288 MB | 6 | 12 GB |

Forty workers on Premium is a comfortable blog and a thin ecommerce site. It is
not enough for a WooCommerce store with a large catalogue, an uncached
membership site, or anything that makes outbound API calls inside a page
request. Every slow page holds a worker for its entire duration. Ten requests
that each take three seconds will occupy ten workers for three seconds.

### 2. A runaway plugin or bot traffic

Plugins cause 503s in two ways. A badly written plugin can loop, making the same
query hundreds of times in a single request, which holds a worker for seconds
instead of milliseconds. Or a plugin can make an external HTTP call on every page
load, which turns a 50 ms request into a 2,000 ms request.

Bot traffic is the other half of this. Crawlers that ignore your robots file,
scrapers, and badly configured uptime monitors can generate thousands of PHP
requests per hour. On Premium, 40 concurrent bot requests is a full outage.

### 3. Memory limit hit

When a PHP process tries to allocate more memory than the plan allows, it dies.
LiteSpeed sees a dead backend and returns 503. Premium caps PHP memory at
**1,536 MB**, Unlimited at **2,048 MB** and Cloud Startup at **3,072 MB**.

A single WordPress request rarely needs that much. A page builder rendering a
complex layout, an image plugin resizing a large upload, or a backup plugin
walking the database can all exceed it. The error appears in the log as an
allowed memory size exhausted message.

### 4. A crashed PHP process

If PHP itself falls over — a segfault in an extension, a corrupted opcode cache —
the backend disappears and LiteSpeed returns 503 for every request until the
process restarts. This one resolves itself when the process manager restarts
PHP, which is why "it fixed itself after five minutes" usually points here.

### 5. A genuine platform incident

The rarest cause. If Hostinger has a problem in the data center region your site
sits in, every site there is affected. This is the only case where you wait.

## Diagnosis, step by step

### Check the resource usage graph

In hPanel, open your website's management area and find the resource usage graph.
It shows CPU, memory and entry processes over time. What you are looking for is
shape, not numbers.

- **Flat-topped peaks** that touch the ceiling repeatedly: you are hitting a
  plan limit. This is structural and configuration will not fix it.
- **One tall spike** with normal values either side: a traffic event or a bot
  flood. Find the source.
- **Sustained high memory with low CPU**: usually a plugin holding a large
  dataset in memory.

### Check whether the whole server is affected

Load a static asset directly. If it serves instantly while PHP pages fail, you
have confirmed a PHP-side problem. If the static asset also fails, look at
Hostinger's status page and support chat before doing anything else.

### Read the access log for bot floods

Hostinger keeps access and error logs for each site, reachable from the file
manager or the logs area of hPanel. Sort by IP and by user agent and look for a
single source generating hundreds or thousands of requests.

A typical bot flood looks like the same IP hitting many URLs in quick
succession, or a user agent like a generic crawler requesting pages it has no
reason to request. Blocking that IP or user agent in `.htaccess`, or at the CDN
layer, often resolves the 503 within minutes.

### Check the PHP error log

The error log tells you whether the cause is memory or a fatal error. Look for
"Allowed memory size exhausted" (memory limit), "Maximum execution time
exceeded" (a stuck request holding a worker), or a PHP fatal error naming a
specific plugin file.

### Disable plugins in bulk

Renaming the plugins folder through the file manager deactivates every plugin at
once. If the site recovers immediately, the cause is a plugin. Reactivate them
in small groups to identify which one.

## The fixes that work

**Enable caching first.** On WordPress, install LiteSpeed Cache and turn on page
caching. A cached page never invokes PHP, so it never occupies a worker. This is
the single highest-leverage change available on any Hostinger plan. Pair it with
the built-in CDN, which serves static assets from an edge location.

**Cut the plugin count.** Every active plugin adds code to every request. Sites
running 30 plugins on Premium will hit 503 under load that a 10-plugin site
handles without noticing.

**Block the bots.** Add rules to `.htaccess` to deny the offending user agents or
IP ranges, or use the CDN's firewall rules if your plan includes them. Also
confirm that your own uptime monitor is not polling every 30 seconds — that is
720 PHP requests a day from one source, and it multiplies across monitors.

**Raise the memory limit if that is the binding constraint.** In the site's PHP
configuration area in hPanel you can raise the memory limit up to the plan
maximum. Going beyond the maximum is not possible; that is what the upgrade is
for.

**Fix the slow query.** If the graph shows CPU high and memory normal, look for a
database query running on every page load. Database bloat and missing indexes are
common on sites that have been running for years.

**Restart PHP if you suspect a crash.** Waiting a few minutes is usually enough,
but support can restart the PHP service on request if the problem persists after
a configuration change.

## When to upgrade

Upgrade when the resource graph shows you saturating your plan on ordinary days,
not on your worst day. The thresholds we use:

| Symptom | What it means | Action |
| --- | --- | --- |
| 503 only during a traffic spike | Worker pool too small for peaks | Enable caching first, then consider Unlimited |
| 503 most afternoons | Sustained demand above plan capacity | Move up a tier |
| Memory exhausted in the error log | Single request exceeds the plan limit | Raise the limit, then upgrade if it recurs |
| 503 with high CPU and normal memory | Slow plugin or query | Profile and remove the plugin |
| 503 with high entry processes and low CPU | Bot flood | Block the source |
| 503 on static files too | Platform incident | Wait and check status |

The upgrade path that most people take is Premium to Unlimited. It costs $1/mo
more on the 48-month term and moves you from 40 PHP workers to 60, from 1 CPU
core to 2, from 2 GB RAM to 3 GB, and from 20 GB SSD to 50 GB NVMe. It also
switches backups from weekly to daily, which matters when you are debugging
under pressure. Our [Unlimited plan breakdown](/plans/unlimited/) covers the
detail.

If your 503s come with slow pages rather than outright failures, the problem may
be performance rather than capacity — our
[12 fixes for a slow Hostinger site](/blog/hostinger-website-slow-fix/) works
through that in priority order. If the site returns a blank page instead of a
503, start with the
[white screen guide](/blog/fix-wordpress-white-screen-hostinger/) instead.

## A short prevention checklist

1. Install LiteSpeed Cache and enable page caching before you need it.
2. Turn on the built-in CDN.
3. Keep active plugins under about 15.
4. Set your uptime monitor to a sane interval — five minutes, not thirty
   seconds.
5. Check the resource graph once a month so you see trends rather than crises.
6. Know your plan's worker count and memory limit, so you recognise the ceiling
   when you hit it.
