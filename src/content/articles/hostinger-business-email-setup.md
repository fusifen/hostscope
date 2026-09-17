---
title: "Hostinger Email Setup: Mailboxes, DNS and Deliverability"
description: "Create a Hostinger mailbox, connect it to Gmail, Outlook or Apple Mail over IMAP, and fix deliverability with SPF, DKIM and DMARC records."
pubDate: 2026-02-25
updatedDate: 2026-09-16
author: "priya-nair"
category: "tutorial"
tags: ['hostinger email', 'imap', 'spf', 'dkim', 'deliverability']
primaryKeyword: "hostinger email setup"
affiliateNotice: true
featured: false
readingTime: 9
relatedPlans: ['premium', 'unlimited', 'cloud-startup']
relatedArticles: ['how-to-install-wordpress-on-hostinger', 'hpanel-beginner-guide', 'hostinger-free-ssl-setup', 'how-to-point-a-domain-to-hostinger']
steps:
  - name: "Check that the domain is on Hostinger DNS"
    text: "Email authentication depends on TXT records, so the domain's DNS should be managed by Hostinger before you start. If the nameservers still point elsewhere, either move them or plan to add the records manually at your current provider."
  - name: "Create the mailbox in hPanel"
    text: "Open Emails in the sidebar, choose the domain, and click to create a new mailbox. Enter the name you want, the password, and optionally a display name and an autoresponder."
  - name: "Note the IMAP and SMTP settings"
    text: "hPanel shows the incoming and outgoing server details for the mailbox. Write them down: imap.hostinger.com on port 993 with SSL for incoming, smtp.hostinger.com on port 465 with SSL for outgoing, authenticated with the full email address and the mailbox password."
  - name: "Connect the mailbox to your mail client"
    text: "In Gmail, add it under Accounts and Import, Send mail as, and also under Check mail from other accounts for incoming. In Outlook, add a new account and choose manual setup so you can enter IMAP and SMTP by hand. On iPhone and Mac, choose Other rather than the automatic provider list."
  - name: "Publish SPF, DKIM and DMARC"
    text: "Add the SPF TXT record, enable DKIM signing in hPanel so the DKIM record appears in DNS, and add a DMARC TXT record starting at p=none with an address for reports. Tighten the policy to quarantine once the reports look clean."
  - name: "Send a test to a strict provider"
    text: "Send a message from the mailbox to a Gmail or Outlook address and open the raw headers. Check that SPF and DKIM both show pass and that DMARC aligns. If any of the three fails, the message is far more likely to be filtered."
  - name: "Switch WordPress off PHP mail()"
    text: "Install an SMTP plugin and route WordPress email through the mailbox or a transactional provider. PHP mail() is capped at 10 emails per minute and 100 per day on a rolling 24-hour basis, which a store will hit in an afternoon."
faqs:
  - question: "How many email accounts do I get with Hostinger?"
    answer: >-
      Two mailboxes per website on Premium, five on Unlimited and ten on Cloud
      Startup. They are free for the first year, then renew at Hostinger's
      standard mailbox rate. Mailboxes are counted per website, so a Premium
      account with three sites can create six in total.
  - question: "Can I use my Hostinger mailbox inside Gmail?"
    answer: >-
      Yes. Add the address under Gmail's Send mail as setting to send through
      Hostinger's SMTP server, and add it again under Check mail from other
      accounts to pull incoming mail in over IMAP. You then read and write the
      address from inside Gmail without paying for Google Workspace.
  - question: "What are the Hostinger IMAP and SMTP settings?"
    answer: >-
      Incoming is imap.hostinger.com on port 993 with SSL. Outgoing is
      smtp.hostinger.com on port 465 with SSL, or port 587 with STARTTLS. The
      username is the full email address and the password is the mailbox
      password. Always confirm the values shown in hPanel for your mailbox.
  - question: "What is the difference between SPF, DKIM and DMARC?"
    answer: >-
      SPF lists which servers are allowed to send mail for your domain. DKIM
      adds a cryptographic signature that proves a message was not altered in
      transit. DMARC tells receiving servers what to do when a message fails
      both checks, and sends you reports about who is sending as your domain.
  - question: "Why is Hostinger capping my email at 100 per day?"
    answer: >-
      Server-based sending through PHP mail() is limited to 10 emails per minute
      and 100 per day, resetting on a rolling 24-hour basis. It is an anti-abuse
      limit on shared infrastructure. Switching to SMTP through a mailbox or a
      transactional provider removes the cap from your application.
  - question: "Do I need to change my MX records?"
    answer: >-
      If your email already runs on Hostinger mailboxes, the MX records are
      configured when the domain is set up and you should leave them alone. If
      you are moving email in from another provider, update the MX records and
      publish SPF and DKIM at the same time so delivery does not break during
      the transition.
  - question: "Why do my emails go to spam even with SPF and DKIM set up?"
    answer: >-
      Authentication proves you are allowed to send; it does not prove you send
      wanted mail. Common causes are sending from a brand-new domain with no
      history, HTML that looks like bulk marketing, missing unsubscribe links,
      or a DMARC policy that still reads p=none. Warm up gradually and keep
      complaint rates low.
---

## The five-minute version

Creating a mailbox in hPanel takes about two minutes. Making sure the mail you send from it lands in an inbox rather than a spam folder takes another fifteen, and that second part is the one people skip.

This guide covers both: the mailbox itself, the IMAP and SMTP settings for Gmail, Outlook and Apple Mail, and the three DNS records — SPF, DKIM and DMARC — that decide whether your email is trusted.

## How many mailboxes you get

Mailboxes are counted per website, not per account, which is easy to miss.

| Plan | Mailboxes per site | Free period | Notes |
| --- | --- | --- | --- |
| Premium | 2 | First year | Three sites means six mailboxes in total |
| Unlimited | 5 | First year | Free domain included |
| Cloud Startup | 10 | First year | Dedicated IP, which helps sending reputation |

After the first year, mailboxes renew at Hostinger's standard rate. If you only need one address, that is fine. If you need twenty, a dedicated email provider will usually be cheaper than stacking mailboxes on top of hosting.

## Creating the mailbox

Open **Emails** in the hPanel sidebar and choose the domain you are working with.

The form asks for a mailbox name — the part before the `@` — a password, and optionally a display name and an autoresponder message. Two practical notes.

Use a password generated by a password manager rather than something you can type from memory. Mailbox passwords are stored in every client you connect, and a compromised mailbox is a far worse problem than a compromised website: it lets an attacker reset the passwords of everything else tied to that address.

And pick the address you will actually publish. `hello@`, `sales@` and your own first name all work. `admin@` and `info@` attract more spam because they are the first guesses in every scraper's list.

> A rule worth following: create one mailbox per human, plus one role address for the website. Shared logins and forwarding chains are how a small business loses track of who sent what.

## Connecting it to Gmail, Outlook and Apple Mail

Hostinger mailboxes work over standard IMAP and SMTP, so any client can use them. You do not need Google Workspace or Microsoft 365 to read your domain email inside those apps.

| Setting | Value |
| --- | --- |
| Incoming server (IMAP) | `imap.hostinger.com` |
| Incoming port | 993, SSL/TLS |
| Outgoing server (SMTP) | `smtp.hostinger.com` |
| Outgoing port | 465 with SSL, or 587 with STARTTLS |
| Username | The full email address, including the domain |
| Password | The mailbox password |
| Authentication | Required for outgoing |

Confirm these against what hPanel displays for your mailbox, because Hostinger occasionally changes hostnames and the panel is always the source of truth.

### Gmail

Gmail needs two separate settings, and people usually add only one of them.

- **To send as your address:** Settings → Accounts and Import → Send mail as → Add another email address. Enter the address, then the SMTP server above. Gmail will send a confirmation code to the mailbox, which you can retrieve from Hostinger webmail.
- **To receive into Gmail:** the same page, Check mail from other accounts → Add a mail account. Enter the IMAP details. Gmail polls on a schedule rather than instantly, so expect a delay of a few minutes.

### Outlook

Add a new account and choose manual setup rather than letting Outlook auto-discover, which sometimes guesses a Microsoft server and fails. Select IMAP, enter the incoming and outgoing servers, and tick "require authentication for outgoing".

### Apple Mail on iPhone, iPad and Mac

Add an account, choose **Other** rather than a provider from the list, then **Add Mail Account**. Enter the IMAP and SMTP details by hand. On a Mac you can also fine-tune the outgoing port under Server Settings.

## Deliverability: the part that matters

A mailbox that sends mail which lands in spam is worse than no mailbox, because you will not know it is happening. Three DNS records control this, and they do different jobs.

### SPF — who is allowed to send

SPF is a TXT record that lists the servers permitted to send email for your domain. A receiving server checks the sending server's IP against that list. If it is not on the list, the message fails SPF.

A typical Hostinger SPF record looks like this:

```
v=spf1 include:_spf.mail.hostinger.com ~all
```

The `~all` at the end means "soft fail" — treat anything not listed as suspicious but do not reject it outright. Start there and tighten to `-all` once you are confident nothing else sends as your domain.

Two mistakes are common. First, publishing multiple SPF records: the standard permits exactly one TXT record beginning `v=spf1`, and two records cause a permanent failure. Second, exceeding the ten DNS lookup limit — each `include:` costs a lookup, so a domain that stacks Google, a CRM, a helpdesk and a newsletter tool can blow the budget and fail validation entirely.

### DKIM — proof nothing was altered

DKIM adds a cryptographic signature to every outgoing message. The receiving server looks up a public key published in your DNS, verifies the signature, and confirms the message came from your domain and was not modified in transit.

Hostinger generates the DKIM record for you when you enable signing for the domain in hPanel. You do not have to invent the key. Copy the value exactly as shown, including any trailing part of the string — a truncated DKIM record is a silent failure.

### DMARC — what to do when the other two fail

DMARC ties SPF and DKIM together and tells receivers what to do with mail that fails both. It also sends you reports about who is sending as your domain, which is how you find out that a forgotten plugin or a marketing tool has been spoofing you.

Start here:

```
v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com; fo=1
```

`p=none` means "monitor and report, do not act". Leave it there for a fortnight while you read the reports. When they show only legitimate senders, move to `p=quarantine`, and eventually to `p=reject`. Jumping straight to `p=reject` is how people break their own invoice emails.

### The DNS record reference

| Record | Type | Host | Purpose |
| --- | --- | --- | --- |
| SPF | TXT | `@` | Lists servers allowed to send for the domain |
| DKIM | TXT | Selector host shown in hPanel | Public key for verifying message signatures |
| DMARC | TXT | `_dmarc` | Policy for failures, plus reporting address |
| MX | MX | `@` | Where incoming mail is delivered |
| Mailbox verification | TXT or CNAME | Value shown in hPanel | Proves domain ownership for the mail service |

## The 10-emails-per-minute problem

This is the limit that catches people running a store or a busy contact form.

Hostinger caps server-based sending through PHP `mail()` — and similar — at **10 emails per minute and 100 emails per day**, resetting on a rolling 24-hour basis. It is an anti-abuse control on shared infrastructure, and it applies to your website's code, not to your mailbox.

What that means in practice: WordPress password resets, WooCommerce order confirmations, contact form notifications and newsletter signups all share the same hundred-a-day budget. A modest launch day will exhaust it, and the failure is quiet — the email simply does not send, and nothing in WordPress tells you.

The fix is to stop using `mail()` at all. Install an SMTP plugin such as WP Mail SMTP, point it at your Hostinger mailbox or at a transactional provider, and WordPress sends through a real authenticated mail server with proper SPF and DKIM alignment. The per-minute cap stops applying, deliverability improves, and you get logs showing what was actually sent. Our [WordPress installation guide](/blog/how-to-install-wordpress-on-hostinger/) covers where that fits in the setup order.

## Checking your work

Send a test message from the mailbox to a Gmail address you control, then open the message and view the original. You are looking for three lines.

- `SPF: PASS`
- `DKIM: PASS` with your domain in the `d=` value
- `DMARC: PASS`

If DKIM passes but shows a different domain in `d=`, you have a forwarding problem rather than an authentication one. If SPF fails, the sending IP is not covered by your record — check for a duplicate SPF record first.

Once all three pass and the domain has a few weeks of clean sending history, deliverability becomes largely a content question rather than a technical one.

## Where email sits in the wider setup

Mailboxes are included on every plan, so this is not a reason to upgrade. Resources are. If you are running a store that sends order email, the daily backup and the second CPU core on [Unlimited](/plans/unlimited/) are worth more than the extra mailboxes. Our [plan comparison](/plans/) breaks down what changes between tiers, and if you are still deciding, the [hosting cost calculator](/tools/hosting-cost-calculator/) will show what the renewal years actually cost rather than just the promotional rate.
