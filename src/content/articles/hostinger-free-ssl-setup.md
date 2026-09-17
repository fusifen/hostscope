---
title: "How to Enable and Force HTTPS on Hostinger"
description: "How Hostinger's free automatic SSL works, where to find it in hPanel, how to fix a certificate stuck in a pending state, and how to force HTTPS site-wide."
pubDate: 2026-04-08
updatedDate: 2026-09-15
author: "daniel-okafor"
category: "tutorial"
tags: ['ssl', 'https', 'htaccess', 'mixed content', 'security']
primaryKeyword: "hostinger ssl"
affiliateNotice: true
featured: false
readingTime: 8
relatedPlans: ['premium', 'unlimited', 'cloud-startup']
relatedArticles: ['how-to-point-a-domain-to-hostinger', 'how-to-install-wordpress-on-hostinger', 'hpanel-beginner-guide', 'hostinger-business-email-setup']
steps:
  - name: "Confirm the domain resolves to Hostinger"
    text: "SSL issuance requires the certificate authority to reach your domain on Hostinger's server. Check with dig or nslookup that the domain returns your Hostinger IP before you look at anything else, because a pending certificate is almost always a DNS problem."
  - name: "Find the SSL section in hPanel"
    text: "Open Websites, select the site, and open the SSL section. It shows the current certificate status for each domain and subdomain attached to that site, and offers the install action if a certificate has not been issued automatically."
  - name: "Install the certificate if it was not issued automatically"
    text: "On most setups the free certificate is issued without you doing anything once DNS is correct. If the status is not active, use the install or refresh action in that section and allow a few minutes for validation to complete."
  - name: "Force HTTPS with the hPanel toggle"
    text: "Enable the force HTTPS option for the domain. This adds a server-level redirect so plain HTTP requests are sent to the secure version, which is the simplest way to cover every URL on the site."
  - name: "Add an .htaccess redirect if you need finer control"
    text: "In the file manager, edit the .htaccess file in public_html and add a RewriteEngine block that redirects non-HTTPS requests to HTTPS with a 301. This is useful when you want to exclude a path or handle a proxy in front of the server."
  - name: "Fix mixed content"
    text: "Load the site and open the browser console. Any warnings about insecure resources mean a stylesheet, script or image is still being loaded over http. Update the URL in the theme, plugin or database entry that references it, then clear the cache."
  - name: "Update the WordPress site URL"
    text: "In WordPress, open Settings, General, and confirm both the WordPress Address and Site Address begin with https. If they still say http, WordPress will keep generating insecure links even though the certificate is valid."
  - name: "Verify renewal is automatic"
    text: "Free SSL certificates renew on their own as long as the domain keeps resolving to Hostinger and the DNS records the validation depends on are untouched. Dipping into the DNS zone mid-renewal is the usual cause of a lapse."
faqs:
  - question: "Is SSL really free on every Hostinger plan?"
    answer: >-
      Yes. Free SSL is included on every plan and certificates are unlimited, so
      you can secure every domain and subdomain you host without paying extra.
      There is no upsell to a paid certificate for normal website use.
  - question: "How long does Hostinger SSL take to issue?"
    answer: >-
      Usually within a few minutes of the domain resolving to Hostinger, and
      occasionally up to a couple of hours. If it has been longer than that, the
      cause is nearly always DNS — either the domain still points elsewhere or
      an old record is cached.
  - question: "Why does my certificate say not issued?"
    answer: >-
      The certificate authority has to reach your domain over HTTP to validate
      it, so issuance fails when DNS has not propagated, when a proxy or CDN is
      intercepting the request, or when the domain is not assigned to a site in
      hPanel. Fix the DNS or the assignment and re-run the install.
  - question: "How do I force HTTPS in .htaccess?"
    answer: >-
      Add a RewriteEngine block to the .htaccess file in public_html that
      redirects any request where HTTPS is off to the https version of the same
      URL with a 301 status. Test in a private window afterwards, and keep a
      copy of the original file so you can revert if a rule conflicts.
  - question: "What causes mixed content warnings?"
    answer: >-
      A resource on the page is still loaded over plain HTTP while the page
      itself is HTTPS. That is usually an image, script or font URL hard-coded
      in a theme, a plugin setting or the database. Browsers block or warn about
      these, and the fix is to change the URL to https and clear the cache.
  - question: "Do I need to renew my SSL certificate manually?"
    answer: >-
      No. Free certificates renew automatically while the domain continues to
      resolve to Hostinger. You only need to intervene if you change DNS, move
      the domain to another server, or leave a third-party proxy in front of the
      site.
  - question: "Does forcing HTTPS break my site?"
    answer: >-
      It should not, but it can expose problems that were already there. If
      anything is loaded over HTTP, forcing HTTPS makes the browser block it. Fix
      mixed content first, then turn the redirect on, and check the site in a
      private window immediately afterwards.
---

## The short version

Every Hostinger plan includes free SSL, and certificates are unlimited — there is no per-domain charge and no premium certificate to upgrade to. On most setups the certificate is issued automatically once your domain resolves to Hostinger, and the only thing left for you to do is turn on the redirect that forces visitors onto HTTPS.

The interesting part is what to do when it does not go smoothly, because a certificate stuck in a pending state is one of the most common first-week problems. It is almost never a certificate problem.

## Where SSL lives in hPanel

Open **Websites**, select the site, and open the **SSL** section. That screen shows the certificate status for every domain and subdomain attached to the site, and it is where you install or refresh a certificate manually.

If you have several domains on one plan, each is handled separately. On Premium that is three sites; on Unlimited and Cloud the count is higher, and each one gets its own certificate at no extra cost.

### How the automatic flow works

When you add a domain to a site and the DNS resolves to Hostinger's servers, the panel requests a free certificate from a certificate authority. The authority then validates that you control the domain, typically by asking for a file over plain HTTP on port 80. If it gets the expected response, the certificate is issued and installed.

Two consequences follow from that mechanism, and they explain nearly every failure.

First, port 80 has to be reachable and answering from Hostinger's server. If a third-party proxy or CDN sits in front of the domain and intercepts the request, validation can fail. Second, the domain has to actually point at Hostinger. A domain still resolving to the old host will never validate, no matter how many times you click install.

> The rule that saves the most time: when a certificate will not issue, stop looking at the certificate. Run `dig yourdomain.com A +short` and check the answer first. Nine times out of ten the problem is there.

## When it takes longer than expected

| Status | What it means | What to do |
| --- | --- | --- |
| Active | Certificate issued and installed | Turn on force HTTPS |
| Pending / in progress | Validation requested, not yet complete | Wait 30 minutes, then check DNS |
| Not issued | Validation failed or never started | Verify DNS, then re-run the install |
| Expired | Renewal did not complete | Confirm DNS is unchanged, then reissue |

Issuance is normally a matter of minutes. A couple of hours is still within normal range on a freshly pointed domain. Anything beyond that is a DNS or proxy issue.

### The three real causes of "not issued"

**DNS has not propagated.** The most common cause by a wide margin. Pointing a domain and immediately expecting a certificate is the classic first-week mistake — our [domain pointing guide](/blog/how-to-point-a-domain-to-hostinger/) covers the verification commands.

**A proxy is in the way.** If the domain is behind a third-party CDN with proxying enabled, validation requests may never reach Hostinger. Temporarily disabling the proxy usually resolves it. Note that Hostinger's own nameservers are already Cloudflare-protected, so you do not need to add a second Cloudflare layer — doing so causes more problems than it solves.

**The domain is not assigned to a site.** A domain parked on the account but not attached to a website has nothing to validate against. Attach it to the correct site in hPanel, then install the certificate.

## Forcing HTTPS

A valid certificate does not automatically redirect anyone. Visitors who type `http://` still get an insecure connection until you tell the server to send them elsewhere. There are two ways to do that, and they are not mutually exclusive.

### Option 1: the hPanel toggle

In the site's SSL section there is a force HTTPS option. Turn it on. This adds a server-level redirect for the domain, which is the simplest approach and covers every URL on the site without you writing anything.

Use this unless you have a specific reason not to.

### Option 2: an .htaccess redirect

If you need finer control — excluding a path, handling a proxy, or working around a plugin that rewrites URLs — edit `.htaccess` in `public_html` through the file manager.

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

A few notes on that block. The `R=301` tells browsers and search engines this is permanent, which is what you want. The rule preserves the requested path and query string, so a link to `/blog/post/?utm=x` lands on the secure version of the same page. And if the file already contains a WordPress block between `# BEGIN WordPress` and `# END WordPress`, put your rule above it.

Take a copy of the original file before you edit it. A malformed `.htaccess` returns a 500 error for the whole site, and restoring the copy takes seconds while debugging takes much longer.

### WordPress-specific settings

WordPress stores its own idea of the site URL, and it will happily keep generating `http://` links even when the server is redirecting.

Go to **Settings → General** and confirm both **WordPress Address** and **Site Address** begin with `https`. If they do not, change them. Then check any plugin or theme option that stores an absolute URL — a logo, a background image, a custom footer script — because those live in the database and are not affected by the settings page.

## Fixing mixed content

Mixed content is what happens when an HTTPS page pulls in a resource over HTTP. Browsers treat it differently depending on the resource: images and audio may be upgraded automatically or blocked, while scripts and stylesheets are blocked outright, which is why a page can render with no styling at all.

To find them, load the site in a private window, open the browser developer console, and look for warnings mentioning insecure or mixed content. Each one names the URL responsible.

| What is flagged | Where it usually comes from | Fix |
| --- | --- | --- |
| Stylesheet or script | Theme header, a plugin's CDN setting, a hard-coded URL | Change the URL to https in the theme or plugin settings |
| Image | Content pasted from another site, an old post, a widget | Edit the post or the database entry and update the URL |
| Font | A custom font loaded over http | Update the font source, or self-host it |
| Iframe | An embedded video or map using an http source | Use the provider's https embed code |

After fixing, clear the LiteSpeed Cache and any browser cache. A cached HTML copy will keep serving the old insecure URLs long after you have fixed the source, and it will look like your fix did not work.

## Renewal

Free certificates renew automatically, provided the domain still resolves to Hostinger and the validation path is unobstructed. There is nothing to buy and nothing to schedule.

The failure mode to be aware of is self-inflicted: changing DNS records, moving the domain to another server, or putting a proxy in front of it can interrupt renewal. If a certificate expires unexpectedly, the sequence is the same as a first issuance — confirm DNS, remove the obstruction, then reissue.

For sites that take payments or collect personal data, check the certificate status once a quarter. It takes ten seconds and it removes an entire category of outage from your calendar.

## What to do next

If SSL is working, the remaining setup is email and backups. Mailboxes are included on every plan — 2 per site on [Premium](/plans/premium/), 5 on [Unlimited](/plans/unlimited/) and 10 on Cloud — and the [email setup guide](/blog/hostinger-business-email-setup/) covers connecting them and getting SPF and DKIM right. If you are still choosing a plan, note that SSL is identical across every tier, so it should not influence the decision at all. The [pricing page](/pricing/) and the [plan finder](/tools/plan-finder/) are the places to look instead.
