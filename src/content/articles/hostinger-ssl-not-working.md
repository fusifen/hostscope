---
title: "Hostinger SSL Not Working? Six Fixes in Order"
description: "Six reasons a Hostinger SSL certificate fails, from provisioning delays and DNS mismatches to Cloudflare proxy conflicts, mixed content and a stale site URL."
pubDate: 2026-03-11
updatedDate: 2026-09-16
author: "daniel-okafor"
category: "troubleshooting"
tags: ['hostinger ssl', 'https not working', 'ssl certificate', 'mixed content']
primaryKeyword: "hostinger ssl not working"
affiliateNotice: true
featured: false
readingTime: 9
relatedPlans: ['premium', 'unlimited', 'cloud-startup']
relatedArticles: ['hostinger-email-going-to-spam', 'hostinger-website-slow-fix', 'fix-error-establishing-database-connection-hostinger']
steps:
  - name: "Confirm the certificate exists and is issued"
    text: "Open the SSL section for the domain in hPanel. If the certificate is still provisioning, wait. Issuance is normally fast but depends on DNS resolving correctly first."
  - name: "Confirm DNS points at Hostinger"
    text: "Check that the domain's nameservers or A records resolve to your Hostinger hosting. A certificate cannot validate for a domain that resolves elsewhere."
  - name: "Resolve any Cloudflare proxy conflict"
    text: "If the domain is behind Cloudflare, the proxy can intercept the validation request and the SSL mode setting can conflict with the origin certificate. Set the mode appropriately or temporarily disable the proxy while the certificate issues."
  - name: "Fix mixed content"
    text: "A padlock that shows a warning rather than a lock usually means the page loads some resources over http. Search the theme and database for http:// references and replace them with https://."
  - name: "Force HTTPS"
    text: "Enable the HTTPS redirect for the domain in hPanel, or add a rewrite rule to .htaccess so that every http request is redirected to https."
  - name: "Clear stale browser and CDN caches"
    text: "If the certificate is valid but your browser still shows an error, the browser is holding an old certificate. Clear the SSL state, try a private window, and purge the CDN cache."
faqs:
  - question: "Why does my Hostinger SSL certificate show as not secure?"
    answer: >-
      Either the certificate has not finished issuing, DNS does not point at
      Hostinger yet, a Cloudflare proxy is intercepting validation, the page
      loads mixed http and https content, or your browser is caching an old
      certificate.
  - question: "How long does Hostinger SSL take to activate?"
    answer: >-
      Certificates are installed automatically and usually issue quickly once
      DNS resolves correctly. If it has been more than a day, the problem is
      almost always DNS rather than the certificate itself.
  - question: "Is SSL free on Hostinger?"
    answer: >-
      Yes. Free SSL certificates are included with the plans and installed
      automatically, with unlimited certificates on most plans.
  - question: "What is mixed content and why does it break the padlock?"
    answer: >-
      Mixed content is a page served over https that loads some resources over
      http. The browser blocks or warns about those resources, so the padlock
      does not appear even though the certificate itself is valid.
  - question: "How do I force HTTPS on Hostinger?"
    answer: >-
      Enable the HTTPS redirect for the domain in hPanel, or add a rewrite rule
      to the .htaccess file in your site's root directory so http requests
      redirect to https.
  - question: "Can Cloudflare break Hostinger SSL?"
    answer: >-
      Yes. If the Cloudflare proxy is active and the SSL mode conflicts with the
      origin certificate, visitors can see errors even though the certificate on
      the server is fine. The proxy needs to be configured consistently with the
      origin.
---

## Start with what the browser is actually telling you

"The SSL is not working" covers several different failures, and they have
different fixes. The browser error message tells you which one you have.

| What you see | What it means | Where to start |
| --- | --- | --- |
| `ERR_CERT_AUTHORITY_INVALID` or "not secure" | No valid certificate served for this hostname | Fix 1 and Fix 2 |
| `ERR_SSL_PROTOCOL_ERROR` | Nothing answering on port 443 | Fix 2 |
| Padlock with a warning triangle | Certificate valid, some resources insecure | Fix 4 |
| Padlock missing but page loads over https | Mixed content or an unforced redirect | Fix 4, then force HTTPS |
| Error in one browser only | Cached certificate | Fix 5 |
| Error only after adding Cloudflare | Proxy conflict | Fix 3 |
| Redirect loop between http and https | WordPress site URL still set to http | Fix 6 |

Read the message before changing anything. Half the time people rebuild a
certificate that was never the problem.

> Quick isolation test: open the site in a private window and in a second
> browser. If it works in one and not the other, the certificate is fine and you
> have a cache problem. If it fails everywhere, the problem is on the server or
> in DNS.

## Fix 1: the certificate is still provisioning

Hostinger installs SSL certificates automatically. The process depends on DNS
resolving to Hostinger first, because the certificate authority has to validate
that you control the domain.

In hPanel, open the SSL section for the domain. You will see whether a
certificate is issued, pending, or missing. If it is pending, the correct action
is to wait — usually a short time, but up to a day in the worst case.

Do not request a new certificate while one is pending. Multiple simultaneous
requests for the same hostname can cause rate limiting at the certificate
authority and leave you waiting longer than if you had done nothing.

If the certificate has been pending for more than a day, move to Fix 2. The
certificate is almost certainly waiting on DNS.

## Fix 2: DNS does not point at Hostinger

A certificate cannot be issued for a domain that does not resolve to the server
requesting it. This is the most common cause of a "stuck" certificate.

Check two things:

1. **Nameservers.** In hPanel's Domains area, confirm the domain's nameservers
   are the ones Hostinger specifies. If you moved the domain to Hostinger but
   left the nameservers at your old registrar, the certificate request goes
   nowhere.
2. **A records.** If you are not using Hostinger's nameservers, confirm the A
   record for the root domain and for `www` points at the IP address shown in
   hPanel. If either is missing, the certificate for that hostname cannot
   validate.

Also check for a leftover AAAA record pointing at an old IPv6 address. A stale
AAAA record can make the domain resolve to a host that knows nothing about your
site, and it is easy to miss because everything looks correct on IPv4.

DNS changes take time to propagate. Do not judge the result until a few hours
have passed, and remember that the certificate authority may have cached the old
answer.

## Fix 3: Cloudflare proxy conflict

If your domain sits behind Cloudflare, there are two possible conflicts.

**Validation interception.** Cloudflare's proxy can intercept the certificate
validation request. If issuance keeps failing, temporarily set the DNS record to
DNS-only in Cloudflare so the validation reaches the origin, then re-enable the
proxy after the certificate issues.

**Mode mismatch.** Cloudflare's SSL mode must be consistent with what your
origin serves. If the mode is set to a strict mode that requires a valid origin
certificate and your origin certificate is not yet issued, visitors get an error.
A flexible mode, where Cloudflare talks to the origin over plain HTTP, avoids
that error but creates a redirect loop if your origin also forces HTTPS — which
it should.

The correct end state is: a valid certificate on the origin, Cloudflare set to a
full or strict mode, and the origin forcing HTTPS. Do not leave the origin
unencrypted just to make the error go away.

> If you enabled a proxy and SSL broke in the same hour, undo the proxy change
> first and confirm the site works again before you touch anything else. One
> change at a time is what makes the cause identifiable.

## Fix 4: mixed content

A valid certificate plus an insecure resource equals no padlock. Browsers treat
a page that loads any resource over `http://` as not fully secure, and some
browsers block the resource outright.

Find the offending resources with the browser's developer tools. Open the
Console, reload, and look for mixed content warnings. They name the exact URL
that is loading over http.

Then fix the source:

- **Theme files.** A hardcoded `http://` reference to a font, image or script in
  a template file. Edit the file in the file manager.
- **The database.** WordPress stores absolute URLs in post content and options.
  A search-and-replace across the database is the standard fix — back up first,
  and use a tool that understands serialised data rather than a raw SQL replace.
- **Plugins.** Some plugins generate absolute URLs from a stored setting. Update
  the setting rather than patching the output.
- **Third-party embeds.** An embedded widget that only offers an http endpoint
  cannot be fixed locally. Replace it or remove it.

After fixing the source, purge every cache layer: the LiteSpeed Cache page
cache, any object cache, and the CDN cache. A cached HTML page will keep serving
the old http references even after you have fixed the database.

## Fix 5: a stale cached certificate

If the certificate is valid on the server, the site loads over https in a private
window, but your normal browser still complains, the browser is holding an old
certificate or an HSTS state from a previous configuration.

- Clear the browser's SSL state. In Chrome this is under the privacy settings,
  in the section for managing certificates.
- Try a different browser to confirm the diagnosis.
- Purge the CDN cache if a CDN sits in front of the site.
- If you previously served a self-signed certificate, the browser may have
  remembered a rejection. Clearing the SSL state resolves it.

## Fix 6: the WordPress site URL is still http

This one is worth its own entry because it mimics mixed content and survives
every other fix. If WordPress's `siteurl` and `home` options are set to `http://`,
WordPress generates http links everywhere, and forcing the redirect creates a
loop where the browser bounces between http and https.

Check the values in the WordPress settings, or in `wp-config.php` if they are
defined there. Update them to `https://`, then purge the cache. If the admin area
becomes unreachable after the change, that is the classic symptom of a mismatch —
revert the value, fix the redirect, and try again in the other order.

## How to force HTTPS

Even with a perfect certificate, visitors who type the plain domain or follow an
old `http://` link will land on the unencrypted version. Force the redirect.

### Through hPanel

In the SSL area for the domain there is an HTTPS redirect setting. Enabling it
makes Hostinger handle the redirect at the server level, which is the cleaner
option because it survives theme changes and plugin updates.

### Through .htaccess

If you prefer to control it yourself, add a rewrite rule to the `.htaccess` file
in your site's root directory, above the WordPress block:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

Back up `.htaccess` before editing it. A syntax error in this file takes the
whole site down with a 500 error, not just the redirect.

If you are also changing the site's canonical URL, do the redirect first, confirm
the site loads over https, and only then update the WordPress site URL. Changing
both at once makes it hard to tell which one broke the site.

## How to check a certificate properly

1. Open the site in a browser and click the padlock. View the certificate and
   confirm the hostname matches, the issuer is a real certificate authority, and
   the expiry date is in the future.
2. Open developer tools, go to the Security panel, and read the summary. It tells
   you whether the connection is fully secure and lists any insecure resources.
3. Run the domain through an SSL checker service. It will report the certificate
   chain, expiry and any protocol issues that a browser glosses over.
4. Test both the root domain and `www`. A certificate issued for one and not the
   other is a common and easily missed failure.

> Test `https://` and `https://www.` separately, every time. Roughly half the
> "SSL is broken" reports we see turn out to be a certificate that covers one
> hostname and not the other.

## The order to work in

1. Read the browser error and identify the failure type.
2. Confirm the certificate is issued.
3. Confirm DNS resolves to Hostinger, including the AAAA record.
4. Resolve the Cloudflare proxy or mode conflict.
5. Fix mixed content, then purge every cache.
6. Clear the browser SSL state if only one browser fails.
7. Check the WordPress site URL, then force HTTPS via hPanel or `.htaccess`.

Free SSL is included on every plan, and unlimited certificates on most — the
[Premium plan page](/plans/premium/) covers what is bundled at the entry tier,
and [Cloud Startup](/plans/cloud-startup/) adds a dedicated IP. If the site is
slow rather than insecure, the
[speed checklist](/blog/hostinger-website-slow-fix/) is the better starting
point, and if mail rather than the website is failing, see the
[email deliverability guide](/blog/hostinger-email-going-to-spam/).
