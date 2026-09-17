---
title: "Hostinger Emails Landing in Spam: Fixing SPF, DKIM and DMARC"
description: "Why Hostinger emails land in spam and how to fix it with SPF, DKIM and DMARC records, plus the send limits that silently break contact forms."
pubDate: 2026-02-27
updatedDate: 2026-09-16
author: "priya-nair"
category: "troubleshooting"
tags: ['hostinger email', 'spf', 'dkim', 'dmarc', 'email deliverability']
primaryKeyword: "hostinger email going to spam"
affiliateNotice: true
featured: false
readingTime: 8
relatedPlans: ['premium', 'unlimited', 'cloud-startup']
relatedArticles: ['fix-hostinger-503-error', 'hostinger-ssl-not-working', 'fix-wordpress-white-screen-hostinger']
steps:
  - name: "Check the send limit first"
    text: "Confirm you are not hitting the server send cap. PHP mail() and similar server-based sending is limited to 10 emails per minute and 100 per day, resetting on a rolling 24-hour basis. Over the cap, mail is dropped or queued, not delivered."
  - name: "Move sending to SMTP"
    text: "Switch WordPress and any contact form plugin from PHP mail() to authenticated SMTP using your Hostinger mailbox credentials. Hostinger recommends SMTP for reliable delivery, and authenticated mail is far less likely to be filtered."
  - name: "Publish an SPF record"
    text: "In hPanel's DNS zone editor for the domain, add a TXT record on the root host with the SPF include value shown in your email settings. There must be only one SPF record per domain."
  - name: "Publish a DKIM record"
    text: "Enable DKIM in the email settings in hPanel, then add the DKIM TXT record it generates to DNS. The host is the selector name and the value is the public key."
  - name: "Publish a DMARC record"
    text: "Add a TXT record at _dmarc with a starting policy of p=none and an address for aggregate reports. Move to p=quarantine once your legitimate mail passes alignment."
  - name: "Verify with a header check"
    text: "Send a test message to a Gmail address, open the original message, and read the authentication results header. You want spf=pass, dkim=pass and dmarc=pass."
  - name: "Warm the domain up"
    text: "If the domain is new, send small volumes for the first two weeks, starting with your most engaged contacts. Sudden volume spikes from a new domain look like spam to every major provider."
faqs:
  - question: "Why do emails from my Hostinger mailbox go to spam?"
    answer: >-
      The most common causes are missing or incorrect SPF and DKIM records,
      sending through PHP mail() instead of authenticated SMTP, and the
      reputation of the shared IP address your mail leaves from.
  - question: "What is Hostinger's email sending limit?"
    answer: >-
      Server-based sending through PHP mail() and similar functions is capped at
      10 emails per minute and 100 per day, resetting on a rolling 24-hour
      basis. Hostinger recommends SMTP for reliable delivery.
  - question: "Can I send more than 100 emails a day from Hostinger?"
    answer: >-
      Not through the server mail function. If you need higher volume you should
      use a dedicated transactional email service for automated mail, and keep
      the hosting mailbox for person-to-person correspondence.
  - question: "Do I need both SPF and DKIM?"
    answer: >-
      Yes. SPF tells the receiving server which servers may send for your
      domain. DKIM cryptographically signs the message so it cannot be altered
      in transit. They solve different problems and receivers weigh both.
  - question: "What DMARC policy should I start with?"
    answer: >-
      Start with p=none, which asks receivers to report but take no action. Read
      the reports, fix anything that fails, then move to p=quarantine and
      eventually p=reject.
  - question: "How long do DNS changes take to propagate?"
    answer: >-
      Usually within a few hours, but up to 48 hours in the worst case. Do not
      judge whether a record is correct until propagation has completed, and
      remember that receivers may cache old records for a while.
---

## Why it happens

An email landing in spam is not one problem. It is a judgement made by the
receiving server, based on three things: whether you are allowed to send for your
domain, whether the message was tampered with in transit, and whether your
sending reputation is good.

Hostinger gives you the tools for all three. What it does not do is configure
them for you in every case. A domain that was added to hPanel without DNS
authentication records will have mail accepted by some providers and filtered by
others, and the difference is usually invisible until someone tells you your
invoice never arrived.

There are four root causes worth checking, in order.

### 1. Missing or wrong DNS authentication records

SPF, DKIM and DMARC are DNS records that tell receiving servers what to expect.
If SPF is missing, the receiver has no way to know that Hostinger's mail servers
are allowed to send for your domain. If DKIM is missing, the message carries no
signature. If DMARC is missing, you have not told anyone what to do when either
check fails.

Wrong is as bad as missing. A typo in the SPF include value, or a second SPF
record added alongside the first, breaks authentication just as thoroughly as
having no record at all. A domain may have only **one** SPF record.

### 2. Shared IP reputation

On shared hosting plans, your outbound mail leaves from an IP address shared with
other Hostinger customers. If one of them sends spam, the reputation of that IP
drops and your legitimate mail suffers. This is a structural feature of cheap
shared hosting and it is one of the reasons a dedicated IP is included on
Unlimited and Cloud Startup but not on Premium.

You cannot fix a shared IP reputation directly. What you can do is make sure
every other signal is perfect, so that the receiver's decision rests on your
authentication and engagement rather than on the IP alone.

### 3. Sending through PHP `mail()` instead of SMTP

This is the biggest self-inflicted problem. WordPress sends email through PHP's
`mail()` function by default. Those messages are often sent without
authentication, from the web server rather than from your mailbox, and with
headers that look different from mail sent through a real mail server.

Receiving providers treat unauthenticated mail from a shared web server as
suspicious, and they are right to. Switching to authenticated SMTP — using your
Hostinger mailbox credentials — fixes the majority of spam-folder cases on its
own.

### 4. The send cap

Hostinger limits server-based sending to **10 emails per minute and 100 emails
per day**, resetting on a rolling 24-hour basis. This is a hard constraint, and
it is the one people hit without realising.

A WooCommerce store that emails every customer on every order status change will
exceed 100 a day faster than you would think. A contact form that sends both a
notification and an autoresponder doubles the count. When you exceed the cap,
mail is not delivered — it is dropped or deferred, which looks exactly like
"going to spam" from the outside.

> If your mail "goes to spam" in bursts rather than consistently, suspect the
> send cap before you suspect the filters. Check your volume over a 24-hour
> window first. It takes two minutes and it is the most commonly missed cause.

## The records to add

You will find the exact values for your domain in hPanel's DNS zone editor and
email settings. Use the values Hostinger shows you — the table below explains
what each record does and what its value looks like, with placeholders where the
value is domain-specific.

| Record type | Host / name | Value | Notes |
| --- | --- | --- | --- |
| TXT | `@` (root domain) | `v=spf1 include:<hostinger-spf-host> ~all` | Only one SPF record per domain. Use the include value from your email settings |
| TXT | `<dkim-selector>._domainkey` | `v=DKIM1; k=rsa; p=<public-key>` | Selector and key are generated when you enable DKIM in hPanel |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:<your-address>` | Start with p=none, then tighten to quarantine, then reject |
| CNAME or TXT | Mail subdomain as shown in hPanel | Value shown in hPanel | Some setups use a CNAME for the mail host rather than a TXT record |

A few rules that save time:

- **One SPF record only.** If a record already exists, edit it and add the
  include. Do not create a second TXT record starting with `v=spf1`.
- **TXT values have a length limit.** Long DKIM keys are sometimes split into
  chunks by the DNS editor. Let hPanel generate the record rather than typing it.
- **Do not guess the include host.** Copy it from your email settings page.
- **Keep the SPF lookup count low.** Each `include` counts against a limit of ten
  DNS lookups. Adding every marketing tool you use to SPF will eventually break
  it for everyone.

## How to verify it worked

Do not trust a green tick in a control panel. Test with a real message.

1. Send a message from your Hostinger mailbox to a Gmail address you control.
2. Open the message in Gmail, use the menu to show the original.
3. Find the `Authentication-Results` header.
4. Check for `spf=pass`, `dkim=pass` and `dmarc=pass`.

If any of the three fails, the header usually names the reason — a missing
record, a failed alignment, or a signature that did not verify. That reason is
your next step, and it is far more useful than guessing.

You can also send to a mail-tester style service, which scores the message and
lists which records are missing. Use one of those alongside the header check: the
header tells you what happened, the scorer tells you what is missing.

### WordPress-specific checks

If WordPress is sending mail, also confirm:

- Your SMTP plugin is configured with the correct host, port and credentials.
- The From address matches your domain. Sending as a Gmail address from a
  Hostinger server fails alignment.
- Test emails actually arrive in the inbox, not just leave the queue.

## The warm-up routine for a new domain

A brand-new domain has no sending history, and providers treat it cautiously. If
you blast 500 emails on day one, you will land in spam regardless of your
records.

1. **Week one: send to your most engaged contacts only.** People who reply,
   open and move your mail out of the promotions tab. Twenty to fifty messages a
   day.
2. **Week two: expand to your full opt-in list in small batches.** Keep the
   volume steady rather than spiking.
3. **Week three onward: increase gradually.** A doubling per week is a
   reasonable pace.
4. **Never buy a list.** Purchased lists generate complaints, and complaints
   damage the shared IP that every other Hostinger customer on it uses.
5. **Make unsubscribing easy.** A visible unsubscribe reduces spam reports, and
   spam reports are what actually destroy a reputation.

## The practical fix list

1. Check your 24-hour send volume against the 10/minute and 100/day cap.
2. Move WordPress and contact forms from PHP `mail()` to authenticated SMTP.
3. Confirm one SPF record exists and contains the correct include value.
4. Enable DKIM in hPanel and publish the generated record.
5. Publish a DMARC record starting at `p=none`.
6. Wait for propagation, then verify with a real header check.
7. Warm the domain up if it is new.
8. For volume above 100/day, move automated mail to a dedicated transactional
   service and keep the hosting mailbox for human correspondence.

## When it is not your fault

If your records are correct, your volume is within the cap, and you are sending
through authenticated SMTP, and mail still lands in spam, the likely cause is the
shared IP reputation. That is the moment to consider a plan with a dedicated IP —
Unlimited, Cloud Startup and above include one, while Premium does not. Our
[Unlimited plan breakdown](/plans/unlimited/) explains what else changes at that
tier, and the [Cloud Startup page](/plans/cloud-startup/) covers the step above
it.

If you are troubleshooting a site at the same time, the
[503 error guide](/blog/fix-hostinger-503-error/) and the
[slow site checklist](/blog/hostinger-website-slow-fix/) cover the most common
hosting-side problems. For a broader view of what each plan includes, start with
the [pricing comparison](/pricing/).
