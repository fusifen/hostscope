---
title: "How to Point a Domain to Hostinger (Nameservers and A Records)"
description: "Two ways to connect a domain to Hostinger hosting: change the nameservers, or keep your DNS and point an A record instead. Plus how to verify it worked."
pubDate: 2026-02-18
updatedDate: 2026-09-16
author: "daniel-okafor"
category: "tutorial"
tags: ['dns', 'nameservers', 'domain setup', 'a record', 'cloudflare']
primaryKeyword: "point a domain to hostinger"
affiliateNotice: true
featured: false
readingTime: 7
relatedPlans: ['premium', 'unlimited', 'cloud-startup']
relatedArticles: ['hpanel-beginner-guide', 'how-to-install-wordpress-on-hostinger', 'hostinger-free-ssl-setup', 'hostinger-business-email-setup']
steps:
  - name: "Decide which path you are taking"
    text: "Change the nameservers at your registrar if you want Hostinger to manage all DNS. Keep your DNS where it is and point an A record at Hostinger if you run email, a CDN or other services through a different provider."
  - name: "Find the values you need in hPanel"
    text: "Open Websites, select the site, and look at the DNS or nameserver section. Hostinger shows the nameservers to use and the IP address your domain should resolve to. Copy both before you leave the panel."
  - name: "Path A: change the nameservers at your registrar"
    text: "Log in to your registrar, open the domain's nameserver settings, choose custom nameservers and replace the existing entries with Hostinger's. Remove any old nameservers rather than adding to them."
  - name: "Path B: keep your DNS and add records"
    text: "At your current DNS provider, create an A record for the bare domain pointing at Hostinger's IP, and a CNAME for www pointing at the bare domain. Leave MX records alone unless email is moving too."
  - name: "Lower your TTL before you switch"
    text: "If you control the old zone, drop the TTL on the records you are changing to 300 seconds a day in advance. That shortens the window in which some visitors still see the old destination."
  - name: "Verify the change with dig or nslookup"
    text: "Run dig yourdomain.com A +short or nslookup yourdomain.com against a public resolver such as 1.1.1.1. Repeat from a different network if the answer looks wrong, and compare against an online DNS propagation checker."
  - name: "Wait, then check the site loads"
    text: "Propagation usually completes in minutes and can take up to 48 hours. Once the domain resolves to Hostinger, install your site files, then enable SSL. Do not point the domain before there is something at the other end."
faqs:
  - question: "How long does it take for a domain to point to Hostinger?"
    answer: >-
      Usually between a few minutes and a couple of hours. The absolute ceiling
      is governed by your old TTL value, and the theoretical worst case is 48
      hours. If nothing has changed after 48 hours, the nameservers were almost
      certainly entered incorrectly or an old record is still cached.
  - question: "Should I change nameservers or just add an A record?"
    answer: >-
      Change the nameservers if Hostinger will manage everything — it is one
      edit and the panel keeps the zone correct. Keep your DNS elsewhere and use
      an A record if email, a CDN or another service depends on records that
      live at your current provider and you do not want to recreate them.
  - question: "What is the difference between an A record, a CNAME and an MX record?"
    answer: >-
      An A record maps a hostname to an IPv4 address, which is what actually
      points a domain at a web server. A CNAME maps one hostname to another
      hostname, which is why www usually points at the bare domain. An MX record
      says where email for the domain should be delivered and has nothing to do
      with your website.
  - question: "Can I point my domain at Hostinger before my site is ready?"
    answer: >-
      You can, but you should not. Until files exist at the destination, anyone
      visiting the domain sees Hostinger's default placeholder page, and SSL
      issuance may fail because the domain is not yet serving a site. Build
      first, point second.
  - question: "Does Hostinger use Cloudflare for DNS?"
    answer: "Hostinger's nameservers are Cloudflare-protected, which means you get Cloudflare's anycast network and DDoS filtering at the DNS layer without doing anything. What you do not get is the ability to toggle Cloudflare's orange-cloud proxy on top — enabling Cloudflare proxying twice on the same domain causes redirect loops and certificate errors. Pick one layer and leave it alone."
  - question: "Why does my domain show a Hostinger parking page?"
    answer: >-
      The DNS is working and the domain is reaching Hostinger, but no website is
      installed on that domain yet, or the domain is not assigned to a site in
      hPanel. Assign it to the correct website and install your files, and the
      placeholder disappears.
  - question: "Do I need to update MX records when I move hosting?"
    answer: >-
      Not if your email stays where it is. MX records are independent of the A
      record that serves your website, so a web host move does not touch them.
      If you also move email to Hostinger mailboxes, update MX and the SPF and
      DKIM records at the same time.
---

## The short answer

There are two ways to point a domain at Hostinger, and the right one depends on where your email lives.

If Hostinger will handle everything — website, email, DNS — change the nameservers at your registrar to Hostinger's. One edit, and hPanel keeps the zone correct from then on. If your email, CDN or another service depends on DNS records that currently live somewhere else, leave the nameservers alone and add an A record for the bare domain plus a CNAME for `www`.

Both paths end in the same place. The difference is who owns the zone file afterwards.

## Before you touch anything

Two things to gather first, because both are in the same place in hPanel.

Open **Websites**, select the site, and look at the DNS section. You will find the nameservers Hostinger wants you to use — currently `ns1.dns-parking.com` and `ns2.dns-parking.com`, though always confirm in the panel rather than trusting a blog post, including this one — and the IP address your domain should resolve to.

Write both down. Then decide which path you are taking.

## Path A: change the nameservers (the easy route)

This is what most people should do. It moves the entire DNS zone to Hostinger, so every record — A, CNAME, MX, TXT — is managed in one place and the panel can add the records SSL and email need without you intervening.

1. Log in to your registrar. That is wherever you bought the domain: GoDaddy, Namecheap, Cloudflare Registrar, Google Domains successors, or a local provider.
2. Find the nameserver settings for the domain. The label varies — "Nameservers", "DNS Servers", "Custom DNS" — but it is always a domain-level setting, not an account-level one.
3. Choose the custom option. Registrars usually offer "use default nameservers" and "use custom nameservers". You want custom.
4. Replace the existing entries. Delete the old nameservers rather than adding Hostinger's alongside them. A domain with four nameservers where two belong to the old host resolves unpredictably, and which set wins depends on the resolver asking.
5. Save. There is no confirmation step beyond the registrar's success message.

That is the whole job. Everything else happens automatically once the change propagates.

### What you lose by moving nameservers

If you currently run email through Google Workspace, Microsoft 365 or a transactional provider, moving the nameservers means recreating those MX, SPF, DKIM and DMARC records in Hostinger's DNS zone. That is not hard, but it is easy to forget, and the failure mode is silent: your website works perfectly and your email stops arriving.

> A rule worth following: before you change nameservers, take a screenshot of every DNS record at your current provider. It costs thirty seconds and it has saved more migrations than any other habit we know of.

If recreating those records sounds like a bad afternoon, take Path B instead.

## Path B: keep your DNS, point an A record

Here you leave the nameservers at your current provider and change only the records that affect the website. This is the right choice when email, a CDN or a verification service already lives in that zone and you would rather not disturb it.

Create these records at your DNS provider.

| Type | Name | Value | What it does |
| --- | --- | --- | --- |
| A | `@` (the bare domain) | Your Hostinger hosting IP | Sends web traffic for `example.com` to Hostinger |
| CNAME | `www` | `example.com` | Sends `www.example.com` to the same place without hard-coding the IP |
| TXT | `@` | Hostinger's verification value, if shown | Proves domain ownership when needed |
| MX | `@` | Unchanged | Mail routing. Leave it alone unless email is moving |

Delete any existing A record for `@` that points at your old host. Two A records for the same name is a common and confusing failure — resolvers round-robin between them, so half your visitors get the old server and half get the new one, which looks exactly like intermittent downtime.

### Lower the TTL first

If you control the old zone, set the TTL on the records you are about to change to 300 seconds a day beforehand. TTL is how long resolvers are allowed to cache an answer. A 24-hour TTL means some visitors keep seeing the old server for most of a day after you switch; a 5-minute TTL means the change is visible almost everywhere within minutes.

## Verifying that it worked

Do not trust the browser alone. Browsers cache aggressively and your own machine is the worst possible place to test from. Use a command line or a public checker.

```
dig example.com A +short
dig example.com NS +short
nslookup example.com 1.1.1.1
```

The first command should return your Hostinger IP. The second should return Hostinger's nameservers if you took Path A, or your original provider's if you took Path B. The third does the same job as `dig` on Windows, where `dig` is not installed by default.

If the answer is wrong, query a specific public resolver rather than your system default. Your ISP's resolver may hold a stale entry long after Cloudflare and Google have updated.

| Symptom | Likely cause |
| --- | --- |
| Old IP still returned everywhere | Nameservers were added, not replaced, or the registrar has not processed the change yet |
| IP correct on one resolver, wrong on another | Normal during propagation. Wait |
| IP correct, site shows a Hostinger placeholder | DNS is fine; no site is installed on that domain yet |
| IP correct, browser shows a security warning | SSL has not been issued yet, which is expected for the first hour or two |
| Email stopped | MX records were lost when the nameservers moved |

## The mistake to avoid

The single most common error is pointing the domain at Hostinger before there is anything at the destination.

You can do it in that order, but the result is a domain that resolves to Hostinger and serves a placeholder page, and — more annoyingly — SSL issuance that may not complete, because the certificate authority has to reach your domain over HTTP to validate it. You then spend an evening debugging a certificate that was never going to work yet.

Point the DNS, wait for it to resolve, then install the site. If you want the site ready first, build it on a temporary domain or a subdomain and move it across afterwards — our [WordPress installation guide](/blog/how-to-install-wordpress-on-hostinger/) covers the installer fields, and the [SSL guide](/blog/hostinger-free-ssl-setup/) explains what to do when the certificate sits in a pending state.

## Cloudflare, twice

Hostinger's nameservers are already Cloudflare-protected. You get the anycast network and DNS-level DDoS filtering as part of the package, without adding an account or a service.

What you should not do is then sign up for Cloudflare separately, add the same domain, and enable the orange-cloud proxy on top. Two proxies in series produce redirect loops, duplicated caching rules and certificate errors that are genuinely hard to diagnose, because each layer reports that it is working correctly.

If you want Cloudflare's full feature set — page rules, Workers, granular caching — the clean way is to move the domain's DNS to Cloudflare entirely and point its A record at Hostinger, taking Path B. One proxy, one place to configure it.

## After the DNS is live

Once the domain resolves to Hostinger, the remaining setup is short: install the site, confirm SSL is issued and force HTTPS, create your mailbox, and check the backup schedule. Our [hPanel tour](/blog/hpanel-beginner-guide/) covers all four in order. If you have not bought hosting yet and you are trying to work out whether you need three websites or unlimited ones, the [plan finder](/tools/plan-finder/) is quicker than reading the spec table, and the [pricing page](/pricing/) has the current numbers.
