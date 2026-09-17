---
title: "hPanel Explained: A Beginner's Tour of Every Menu"
description: "A menu-by-menu tour of Hostinger's hPanel, plus the seven things a beginner should set up in the first hour — domain, WordPress, SSL, email and backups."
pubDate: 2026-03-04
updatedDate: 2026-09-15
author: "priya-nair"
category: "tutorial"
tags: ['hpanel', 'hostinger control panel', 'beginners', 'wordpress', 'ssl']
primaryKeyword: "hpanel"
affiliateNotice: true
featured: false
readingTime: 7
relatedPlans: ['premium', 'unlimited', 'cloud-startup']
relatedArticles: ['how-to-install-wordpress-on-hostinger', 'hostinger-free-ssl-setup', 'hostinger-business-email-setup', 'how-to-point-a-domain-to-hostinger']
steps:
  - name: "Point your domain at Hostinger"
    text: "If the domain was registered on the same Hostinger account, this is already done. Otherwise change the nameservers at your registrar, or add an A record pointing at your hosting IP. Do this before you upload anything so the site is reachable the moment files land."
  - name: "Install WordPress or the Website Builder"
    text: "Open Websites in the sidebar, select the site, and run the one-click WordPress installer. It takes about a minute. If you would rather not run WordPress, the Website Builder does the same job from a drag-and-drop editor or from a chat prompt."
  - name: "Activate free SSL and force HTTPS"
    text: "SSL is included on every plan and is normally issued automatically once DNS points at Hostinger. Confirm the certificate is active in the site's SSL section, then switch on the force HTTPS toggle so plain HTTP requests redirect."
  - name: "Create your first mailbox"
    text: "Open Emails and create the address you will actually publish. Mailbox allowances are 2 per site on Premium, 5 on Unlimited and 10 on Cloud, free for the first year. Connect it to Gmail, Outlook or your phone over IMAP and SMTP."
  - name: "Confirm your backup schedule"
    text: "Premium takes weekly backups. Unlimited and above take daily backups with one-click restore. Find the restore button now, while nothing is broken, so you are not learning the interface during an outage."
  - name: "Locate the file manager and phpMyAdmin"
    text: "Files and Databases in the sidebar are where almost every WordPress problem gets fixed. Bookmark both. The web root is public_html and the database tool is phpMyAdmin."
  - name: "Check resource usage once, while it is low"
    text: "Under Advanced you can see CPU, RAM, I/O and inode consumption for the account. Look at the numbers on day one so you have a baseline to compare against when the site starts feeling slow."
faqs:
  - question: "Is hPanel the same as cPanel?"
    answer: >-
      No. hPanel is Hostinger's own control panel, built in-house and used
      across its shared, cloud, WordPress and email products. cPanel is a
      licensed product sold to most other hosts. They solve the same problems
      but hPanel is organized around websites rather than server services, which
      is why beginners find it quicker to learn.
  - question: "Do I need to learn hPanel before I can use WordPress?"
    answer: >-
      No. You only touch hPanel twice for a normal WordPress site: once to run
      the installer and once to enable SSL. Everything after that happens inside
      the WordPress dashboard. hPanel becomes useful again when you need to
      restore a backup, change a PHP version or debug a database error.
  - question: "Where is the file manager in hPanel?"
    answer: >-
      Files, in the left sidebar. The website's web root is public_html, and a
      default WordPress install puts its core files directly inside it. You can
      edit files in the browser, upload a zip and extract it, or create FTP
      accounts from the same section.
  - question: "Can I use hPanel on a Hostinger VPS?"
    answer: >-
      Not for the server itself. VPS plans are self-managed and ship with a
      separate VPS dashboard for OS reinstalls, firewalls and snapshots. You
      install your own control panel inside the operating system if you want
      one. hPanel only manages Hostinger's managed hosting products.
  - question: "How do I check what is using my CPU and memory?"
    answer: >-
      Open Advanced and look for resource usage, which reports CPU, RAM, I/O
      and inode consumption for the account. On a shared plan those figures are
      the fastest way to tell whether a plugin, a traffic spike or a stuck cron
      job is the problem.
  - question: "What is the first thing I should do after buying hosting?"
    answer: >-
      Point the domain, then install WordPress, then turn on SSL. In that order.
      If DNS is not resolving to Hostinger yet, the SSL certificate cannot be
      issued and the site will show a browser warning, so fixing the domain
      first saves you a confusing detour.
---

## What hPanel actually is

hPanel is Hostinger's own control panel, and it is not cPanel. Hostinger built it in-house and it now drives the shared, cloud, WordPress and email products. If you have ever followed a cPanel tutorial and could not find the icon it told you to click, that is the reason.

The structural difference matters more than the branding. cPanel is organized around server services: a flat grid of around sixty icons where File Manager, MySQL Databases, Email Accounts and SSL/TLS all sit at the same level, with no concept of "the site you are currently working on". hPanel is organized around websites. You select a site, and the tools that belong to it — files, database, SSL, email, backups, DNS — appear inside that site.

That is why beginners get on with it. You rarely have to work out which domain you are editing before you click something.

## The sidebar, menu by menu

Ten sections, top to bottom.

| Sidebar section | What lives there | How often you will use it |
| --- | --- | --- |
| Dashboard | Every site on the account, plan usage, renewal dates, shortcuts to common actions | Weekly, as a health check |
| Websites | The list of sites on your plan plus the per-site tools: WordPress installer, SSL, backups, DNS, PHP settings | Every time you work on a site |
| Domains | Domains registered with Hostinger, nameservers, the DNS zone editor, WHOIS privacy, forwarding | During setup, then rarely |
| Emails | Mailbox creation, webmail access, and the DNS records that authenticate your domain for sending | During setup, then occasionally |
| VPS | Empty unless you own a VPS. Server list, OS reinstall, firewall rules, snapshots | Never on shared hosting |
| Marketing | Hostinger Reach for email campaigns, plus the AI tools that generate content for them | If you send newsletters |
| Files | The file manager and FTP account management | When you need to edit a file by hand |
| Databases | MySQL database creation and phpMyAdmin, with the size of each database shown | WordPress troubleshooting |
| Advanced | Cron jobs, PHP version and limits, SSH access, website caching, resource usage | Occasionally, and whenever the site feels slow |
| Account | Billing, plan upgrades, team users and permissions, API keys, security settings | On billing day |

Hostinger reorganizes the sidebar from time to time, so treat the labels as a map rather than a guarantee. The grouping — sites first, server plumbing second — has been stable for years.

### Websites is where the work happens

Everything that touches a single site lives behind Websites: the WordPress installer, the SSL certificate status, the backup list, the DNS zone for that domain, PHP version and PHP settings, and the caching controls. If you are unsure where a setting lives, start here.

The important thing to notice is that most of these tools are scoped to one site. On Premium you can host three websites, and each one has its own document root, its own database quota and its own mailbox allowance. They share the same pool of 1 CPU core and 2 GB of RAM, which is why one busy site can slow down its neighbours.

## The first hour: what to actually do

Ignore the marketing tabs until your site loads. Work through this in order.

1. **Point the domain.** If you bought the domain from Hostinger on the same account, this is already done. If the domain lives at another registrar, change the nameservers there or add an A record. Our [domain pointing walkthrough](/blog/how-to-point-a-domain-to-hostinger/) covers both routes, including the mistake almost everybody makes first.
2. **Install WordPress or the builder.** From Websites, pick the site and run the WordPress installer. It asks for a site title, an admin email, an admin username and a password, and finishes in about a minute. If you would rather not run WordPress at all, the Website Builder does the same job from a drag-and-drop editor or from a chat prompt.
3. **Turn on SSL.** Every plan includes free SSL and it is normally issued automatically once DNS resolves to Hostinger. Confirm the certificate is active, then enable the force HTTPS toggle.
4. **Create a mailbox.** Create the address you will actually publish — `hello@yourdomain.com` beats `admin@`. Allowances are 2 per site on Premium, 5 on Unlimited and 10 on Cloud, free for the first year.
5. **Check the backups.** Premium is weekly; Unlimited and above are daily with one-click restore. Find the restore button before you need it.
6. **Find the file manager and phpMyAdmin.** Files and Databases in the sidebar. Nine out of ten WordPress problems end up in one of those two places.
7. **Look at resource usage once.** Open Advanced and read the CPU, RAM, I/O and inode figures while they are still low. That is your baseline for "normal".

> A useful rule of thumb: if you cannot find a setting in hPanel, it is almost always attached to a specific website rather than to the account. Select the site first, then look again.

## hPanel vs cPanel

| | hPanel | cPanel |
| --- | --- | --- |
| Built by | Hostinger | cPanel LLC, licensed by most hosts |
| Organizing idea | Website first, then tools | Server service first, then domain |
| Icons to learn | Ten sidebar sections | Sixty-plus, flat |
| Beginner learning curve | Low — most tasks are two clicks | Moderate |
| Where you will meet it | Hostinger | Bluehost, GoDaddy, Namecheap and most others |

The honest downside of hPanel is that it is only Hostinger's. Skills do not transfer to another host the way cPanel skills do, and if you migrate to a cPanel host later you will spend an afternoon relearning where things are. The upside is that you spend that afternoon once, and in exchange you do not spend the first week of your site's life hunting for the icon that creates a database.

## Where hPanel stops

hPanel manages hosting, not servers. Three consequences worth knowing up front.

On shared and cloud hosting you do not get root access, so server-level changes go through the panel or through `.htaccess` in your document root. If you need custom nginx rules, a specific PHP extension compiled in, or full control over the stack, that is a VPS conversation — our [first VPS setup guide](/blog/hostinger-vps-first-setup/) walks through what changes when you move.

Second, hPanel does not include a WHM-style reseller layer. If you manage sites for clients, the multi-site tooling is thinner than a dedicated reseller panel.

Third, the panel is opinionated. PHP versions, caching and SSL are handled for you, which is a feature until you want them handled differently.

None of that is a problem for the reader this panel was designed for. If you are launching a first site on [Premium](/plans/premium/) or moving a small business site to [Unlimited](/plans/unlimited/), hPanel will do everything you need and will not ask you to understand a web server to do it. If you want to compare what each tier gives you before you commit, our [plan finder](/tools/plan-finder/) takes about thirty seconds.
