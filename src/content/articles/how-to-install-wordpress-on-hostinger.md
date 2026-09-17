---
title: "How to Install WordPress on Hostinger in Under 5 Minutes"
description: "The one-click WordPress installer on Hostinger, the fields it asks for, and the eight hardening steps that should follow — permalinks, SSL, caching and backups."
pubDate: 2026-01-28
updatedDate: 2026-09-16
author: "priya-nair"
category: "tutorial"
tags: ['wordpress', 'installation', 'litespeed', 'permalinks', 'plugins']
primaryKeyword: "how to install wordpress on hostinger"
affiliateNotice: true
featured: false
readingTime: 8
relatedPlans: ['premium', 'unlimited', 'cloud-startup']
relatedArticles: ['hpanel-beginner-guide', 'hostinger-free-ssl-setup', 'hostinger-business-email-setup', 'how-to-point-a-domain-to-hostinger']
steps:
  - name: "Open the WordPress installer in hPanel"
    text: "Log in to hPanel, open Websites, select the site you want to use, and choose the WordPress option. If the site has no software on it yet the panel offers the installer directly."
  - name: "Fill in the installer fields"
    text: "The form asks for the site title, an admin email address, an admin username and a password, plus whether to install on the root domain or a subdirectory. Use an email address you actually read, because it receives the password reset link."
  - name: "Replace the auto-generated admin credentials"
    text: "Hostinger fills the username and password fields with generated values. Keep the strong password, but change the username to something that is not admin, administrator or your domain name. Then store the credentials in a password manager before you close the tab."
  - name: "Choose the install location deliberately"
    text: "Installing in the root of the domain puts WordPress at yourdomain.com. Installing in a subdirectory such as blog gives you yourdomain.com/blog. Decide now, because moving it later requires a database search-and-replace."
  - name: "Log in and set permalinks to post name"
    text: "Open Settings, then Permalinks, and select Post name. This turns ugly query-string URLs into readable ones and should be done before you publish anything, because changing it later breaks every link you have already shared."
  - name: "Force HTTPS and confirm SSL is active"
    text: "Enable the force HTTPS toggle in hPanel so plain HTTP requests redirect to the secure version. Then check the WordPress site URL in Settings, General, to confirm it starts with https."
  - name: "Install LiteSpeed Cache and configure it"
    text: "Hostinger runs LiteSpeed, so the LSCache plugin is the caching layer that matters. Install it, run the preset wizard, and turn on page caching, browser caching and image optimisation."
  - name: "Delete unused themes and plugins"
    text: "A fresh WordPress install ships with two or three default themes and several preinstalled plugins. Delete every theme you are not using and every plugin you are not going to use. Unused code is still attack surface."
  - name: "Set up a backup routine you trust"
    text: "Premium takes weekly backups, Unlimited and above take daily ones. If weekly is not enough for your site, install a plugin that backs up to remote storage on a schedule you choose and confirm the first archive completes."
  - name: "Connect the free domain and test from a phone"
    text: "Confirm the domain from your plan is assigned to this website, then load the site on mobile data with the Wi-Fi off. That single test catches DNS, SSL and caching problems that a desktop browser will hide behind its cache."
faqs:
  - question: "How long does the Hostinger WordPress installer take?"
    answer: >-
      About a minute from clicking install to seeing the WordPress dashboard. The
      slower parts are DNS propagation if the domain is new, and SSL issuance,
      which typically completes within a couple of hours of the domain resolving
      to Hostinger.
  - question: "Should I use the auto-generated admin username?"
    answer: >-
      No. Change it to something specific to you. Automated attacks try admin,
      administrator, the domain name and a short list of other guesses first,
      and there is no reason to hand them a valid username. Keep the generated
      password, which is long and random, and store it in a password manager.
  - question: "Which WordPress plugins should a new Hostinger site install?"
    answer: >-
      Five cover almost everything: LiteSpeed Cache for performance, an SEO
      plugin such as Rank Math, a forms plugin such as WPForms, WP Mail SMTP to
      route email through a real mail server, and a backup plugin that stores
      copies off the server. Add security and ecommerce plugins only when you
      actually need them.
  - question: "Why do my WordPress emails not arrive?"
    answer: >-
      PHP mail() is capped at 10 emails per minute and 100 per day, resetting on
      a rolling 24-hour basis, and messages sent that way are frequently filed
      as spam. Install an SMTP plugin and send through a real mailbox or a
      transactional provider instead.
  - question: "Can I install WordPress on more than one website?"
    answer: >-
      Yes. Premium allows three websites, Unlimited and Cloud allow more, and
      each install is independent with its own database, files and plugins. They
      share the plan's CPU and RAM pool, so one heavy site affects the others.
  - question: "Do I need a separate database for each WordPress site?"
    answer: >-
      Yes. The installer creates one automatically, and each install needs its
      own. Premium includes 10 databases, Unlimited includes 150 and Cloud
      Startup includes 300, all capped at 3 GB per database except Cloud, which
      allows 6 GB.
---

## What the installer actually does

Hostinger's one-click installer creates the database, writes `wp-config.php`, downloads the current WordPress core, and creates your admin user. From clicking install to seeing the dashboard is about a minute on a working connection. What takes longer is everything around it — DNS propagation and SSL issuance — and that is where new sites usually get stuck.

Here is the install itself, followed by the eight things that should happen immediately after.

## The install, field by field

Open hPanel, go to **Websites**, select the site, and choose the WordPress option. If nothing is installed on that site yet, the panel offers the installer directly on the site's card.

The form is short, but two of its fields matter more than the rest.

| Field | What to put there | Why it matters |
| --- | --- | --- |
| Site title | Your real site name, not "My Blog" | It is the default title on every page until you change it in WordPress |
| Admin email | An address you actually read | Password resets and security notices go here, and only here |
| Admin username | Something specific to you | `admin` is the first guess in every automated attack |
| Password | Keep the generated value | It is long and random. A memorable password is a weaker password |
| Install path | Root, or a subdirectory | Moving WordPress later requires a database search-and-replace |

### About the auto-generated credentials

Hostinger pre-fills the username and password with generated values. The password is good — long, random, and not worth improving by hand. Store it in a password manager before you close the tab, because the panel will not show it again.

The username is the one to change. If the field says `admin`, replace it. If it says something derived from your domain, replace that too. This is not paranoia: WordPress login endpoints are hit by credential-stuffing bots continuously, and the only thing standing between a bot and your site is a username it has to guess plus a password it cannot.

> A rule worth keeping: change the admin username, keep the generated password, and never reuse that password anywhere else. That combination removes the two failure modes — guessable login and credential reuse — that account for most WordPress compromises.

### Root or subdirectory?

Installing in the root puts WordPress at `yourdomain.com`. Installing in a folder such as `blog` puts it at `yourdomain.com/blog`, which is the right choice if you want a static homepage or a shop on the root domain later.

Pick now. Moving WordPress between the two afterwards means updating the `siteurl` and `home` values and then running a search-and-replace across the entire database, because WordPress stores absolute URLs in post content, widget settings and serialised options. It is doable and it is not fun.

## After the install: eight steps

### 1. Set permalinks to post name

Go to **Settings → Permalinks** and select **Post name**. This changes URLs from `?p=123` to `/your-post-title/`.

Do this before you publish anything. Changing permalink structure after you have shared links breaks them all unless you add redirects, and Google will take weeks to catch up.

### 2. Turn on SSL and force HTTPS

Every Hostinger plan includes free SSL, and on most setups the certificate is issued automatically once the domain resolves to Hostinger. Confirm it is active, then enable the force HTTPS toggle in hPanel so plain HTTP requests redirect.

If the certificate is stuck in a pending state, that is nearly always a DNS problem rather than a certificate problem. Our [SSL troubleshooting guide](/blog/hostinger-free-ssl-setup/) walks through the fix.

### 3. Install LiteSpeed Cache

Hostinger runs the LiteSpeed web server, so caching happens at the server level and the LSCache plugin is the one that talks to it. Install it, run the preset wizard, and enable page caching, browser caching and image optimisation.

LSCache is not the only caching plugin that works on Hostinger, but it is the one that is already integrated with the server. Running a second page-caching plugin alongside it produces stale pages and duplicated rules.

### 4. Delete unused themes and plugins

A fresh WordPress install arrives with two or three default themes and a handful of preinstalled plugins. Delete every theme you are not using and every plugin you are not going to use.

Unused code is not free. It is files on disk counting toward your inode limit — 400,000 on Premium, 600,000 on Unlimited, 2,000,000 on Cloud — and it is code that still needs updating, still gets scanned by attackers, and still shows up in your plugin list when you are trying to remember what you installed.

### 5. Set up a backup routine

Know your plan's schedule before you rely on it. Premium takes weekly backups; Unlimited and above take daily backups with one-click restore.

| Plan | Backup frequency | On-demand restore |
| --- | --- | --- |
| Premium | Weekly | Via support |
| Unlimited | Daily | Yes, one-click |
| Cloud Startup | Daily | Yes, plus on-demand snapshots |

If weekly is too coarse for a site that takes orders, install a plugin that backs up to remote storage on your own schedule. A backup that lives only on the server it is backing up is not a backup.

### 6. Connect the free domain

Your plan includes a free domain for the first year. Confirm it is assigned to this website in hPanel. If the domain was registered elsewhere, the [domain pointing guide](/blog/how-to-point-a-domain-to-hostinger/) covers both the nameserver and A-record routes.

### 7. Create a mailbox and route WordPress email through it

Create at least one mailbox so you have a real address to send from. Mailbox allowances are 2 per site on Premium, 5 on Unlimited and 10 on Cloud, free for the first year.

This matters more than it sounds. WordPress sends password resets, order confirmations and contact-form notifications through PHP `mail()`, which Hostinger caps at 10 emails per minute and 100 per day on a rolling 24-hour basis. On a quiet blog that is fine. On a WooCommerce store it is a hard wall. Install an SMTP plugin, point it at your Hostinger mailbox or a transactional provider, and the limit stops applying. Our [email setup guide](/blog/hostinger-business-email-setup/) has the connection details.

### 8. Test from outside your own network

Load the site on a phone with Wi-Fi switched off. Your desktop browser will happily serve a cached version of a broken site; a phone on mobile data will not.

## The five plugins worth installing on day one

Everything else can wait until you have a reason.

| Plugin | What it does | Why it earns its place |
| --- | --- | --- |
| LiteSpeed Cache | Page caching, browser caching, image optimisation, CSS and JS minification | Talks directly to Hostinger's LiteSpeed server, so it caches at the level the stack was built for |
| Rank Math | Titles, meta descriptions, sitemaps, schema markup, redirects | Handles technical SEO that would otherwise need three plugins, and the free tier is generous |
| WPForms | Drag-and-drop contact and order forms | The form builder most beginners can actually use, with spam filtering included |
| WP Mail SMTP | Routes WordPress email through a real SMTP server | The fix for the 10-emails-per-minute PHP mail() cap and for messages landing in spam |
| UpdraftPlus | Scheduled backups to Google Drive, Dropbox or S3 | Gets a copy off the server, which the hosting backup alone does not do |

Five plugins is a starting point, not a target. Every plugin you add is another thing to update, another thing that can conflict, and another few thousand inodes. If you cannot say what a plugin does for your site in one sentence, do not install it.

## Where to go next

If you have not bought hosting yet, the installer is available on every tier, so the decision is about resources rather than features. [Premium](/plans/premium/) handles three sites with 1 CPU core and 2 GB of RAM, which is comfortable for a blog and tight for a store. [Unlimited](/plans/unlimited/) doubles the cores and adds daily backups and a dedicated IP for a dollar a month more. The [pricing page](/pricing/) has the current numbers and the renewal rates, which matter more than the promotional rate once you are past year one.
