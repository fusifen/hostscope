---
name: KVM 1 VPS
shortName: KVM 1
group: vps
tagline: A full root-access server with 4 GB of RAM for less than a shared plan — if you are willing to manage it yourself.
order: 1
featured: false
rating: 4.4
reviewCount: 1438
bestFor:
  - Developers who want root access on a real Linux server
  - Running a Node.js, Python or Docker application
  - Self-hosted tools such as a VPN, Git server or monitoring stack
  - Learning server administration on hardware that costs less than $7/mo

pricing:
  currency: USD
  termMonths: 24
  termLabel: 24 months
  promoMonthly: 6.49
  regularMonthly: 19.49
  renewalMonthly: 11.99
  freeDomain: true
  freeDomainMonths: 12
  moneyBackDays: 30
  note: The $6.49 rate requires paying the full 24 months upfront ($155.76). Hostinger uses a 24-month term for the best VPS price rather than the 48 months it uses for shared hosting. Renewal is $11.99/mo.

specs:
  websites: "Self-managed — host as many as the resources allow"
  cpuCores: "1"
  ram: "4 GB"
  storage: "50 GB"
  storageType: NVMe
  bandwidth: "4 TB"
  inodes: "Unlimited"
  mailboxes: "Not included — self-managed"
  dedicatedIp: false
  backups: "Free weekly backups"
  cdn: false
  freeSsl: false

features:
  - label: Root access
    included: true
  - label: vCPU cores
    included: "1"
  - label: RAM
    included: 4 GB
  - label: NVMe storage
    included: 50 GB
  - label: Monthly transfer
    included: 4 TB
  - label: Dedicated IPv4 + IPv6
    included: true
  - label: Free domain
    included: 1 year
  - label: Free SSL
    included: false
  - label: CDN
    included: false
  - label: Bundled email
    included: false
  - label: Managed WordPress
    included: false
  - label: Weekly backups
    included: true
  - label: Firewall management
    included: true
  - label: AI web terminal
    included: true
  - label: Public API
    included: true

highlights:
  - $6.49/mo on the 24-month term
  - 1 vCPU, 4 GB RAM, 50 GB NVMe
  - 4 TB of monthly transfer on a 1 Gbps port
  - Full root access and your choice of OS template
  - Free domain for the first year and free weekly backups

pros:
  - Root access and a choice of operating system
  - Dedicated resources — no noisy neighbours at all
  - 4 GB of RAM for less than most shared hosting plans
  - AMD EPYC processors and NVMe storage
  - 4 TB of transfer is far more than a small application needs
  - Free domain for a year and a 30-day money-back guarantee

cons:
  - Self-managed — no hPanel for the server, no managed WordPress
  - No bundled email; you install and run your own mail server
  - No automatic SSL; you configure certificates yourself
  - Weekly backups only, and you are responsible for verifying restores
  - A single vCPU is quickly outgrown by anything CPU-bound
  - No CDN, no one-click staging and no automatic patching

verdict: >-
  KVM 1 is the cheapest way into a real server. For $6.49 a month you get a
  dedicated AMD EPYC core, 4 GB of RAM and 50 GB of NVMe with full root access
  — more memory than Hostinger's shared plans give you at a similar price. The
  trade is that nothing is done for you. You patch the OS, configure the
  firewall rules, issue your own certificates and run your own backups. Buy it
  if you can already use a command line; avoid it if you want a WordPress site
  that simply works.

notFor:
  - Beginners who want a managed WordPress site
  - Anyone who needs bundled email or one-click SSL
  - Production web apps that need more than one core
  - Sites with no technical owner to handle patching and updates

faqs:
  - question: Is a VPS harder to use than shared hosting?
    answer: >-
      Yes, and it is a different product rather than a bigger version of the
      same one. You get a server and a choice of OS template, then you install
      and configure everything yourself. There is no hPanel for the server, no
      managed WordPress and no automatic SSL.
  - question: How much do I pay upfront?
    answer: >-
      $155.76 on the 24-month term, which is $6.49 multiplied by 24. Hostinger
      bills the full term in advance. The regular 24-month total is $467.76 and
      renewal is $11.99/mo.
  - question: Does a VPS include email?
    answer: >-
      Not as a service. There is no bundled mailbox allowance. You can install
      a mail server yourself, but running reliable outbound email from a fresh
      VPS is genuinely difficult and we would not recommend it for anything
      important.
  - question: Do I get a free SSL certificate?
    answer: >-
      No. SSL is not included or configured for you on a VPS. You issue your
      own certificates — Let's Encrypt via Certbot or Caddy is the usual
      approach — and you renew them yourself.
  - question: Can I install WordPress on it?
    answer: >-
      Yes, and many people do. You install the web server, PHP, MySQL and
      WordPress yourself, or use a management tool such as RunCloud or
      CloudPanel. It works well, but it is not the same as Hostinger's managed
      WordPress hosting.
  - question: What happens if the server breaks?
    answer: >-
      You fix it. Hostinger provides the hardware, the network and the
      dashboard, plus free weekly backups. Restoring from them is your
      responsibility, so test that process early rather than during an
      incident.

author: daniel-okafor
publishedDate: 2026-02-11
updatedDate: 2026-09-15
priceChecked: 2026-09-17
---

## What you actually get for $6.49

KVM 1 is a virtual private server, which means it is a different product from
everything else on this site rather than a larger version of it. For $6.49 a
month on the 24-month term you get one AMD EPYC vCPU, 4 GB of RAM, 50 GB of
NVMe storage and 4 TB of monthly transfer on a 1 Gbps port — with full root
access and your choice of operating system.

The price is genuinely low for what is inside. Four gigabytes of RAM is more
than Hostinger's shared plans offer at a similar monthly rate. What you are
not paying for is management. There is no hPanel controlling the server, no
managed WordPress, no bundled mailboxes and no automatic SSL. You are renting
a machine, not a website.

The 24-month term costs $155.76 upfront. Note that Hostinger uses a 24-month
term for the best VPS price rather than the 48 months it uses for shared
hosting, so the upfront commitment is smaller. The regular rate is $19.49/mo
and renewal is $11.99/mo — a much gentler increase than the shared plans see.

Everything in the plan is hardware. There is no management layer, no control
panel for the applications you run, and no support obligation beyond the
infrastructure itself. That is the honest framing: $6.49 buys a machine and a
network connection, and what you get out of it depends entirely on what you
know how to do with it.

### The resources, in plain English

- **1 vCPU on AMD EPYC** — one dedicated core. Fine for a small API, a bot, a
  proxy or a lightly visited site. It is the limit you will hit first if you
  run anything CPU-bound, such as image processing or a build pipeline.
- **4 GB RAM** — this is the reason to buy the plan. It is more memory than a
  shared hosting account gets, and it is yours alone. A Node.js app, a small
  Postgres database and a reverse proxy fit comfortably side by side.
- **50 GB NVMe** — around 20,000–30,000 optimised images, or a healthy amount
  of application code, logs and Docker images. The NVMe interface keeps random
  reads fast, which matters for databases.
- **4 TB monthly transfer** — on a 1 Gbps port. Four terabytes is roughly 4
  million page views of a well-optimised page. Almost nobody on this tier
  comes close.
- **I/O at 300 MB/s** — disk throughput is capped but consistent, and it is
  noticeably higher than shared hosting's 20,480 KB/s ceiling.
- **Unlimited inodes** — the file and directory limits that constrain shared
  hosting do not apply here. You are bounded by disk space instead.
- **One IPv4 and one IPv6 address** — a dedicated IPv4 is included, which is
  why the `dedicatedIp` field reads false on this page: the schema describes
  the shared-hosting dedicated-IP add-on, and on a VPS the address is simply
  part of the product.
- **Free weekly backups** — hardware-level snapshots, not an application-level
  backup service. Test a restore early so you know how it behaves.
- **Firewall management, AI web terminal and a public API** — you can manage
  firewall rules from the dashboard, run commands in a browser terminal and
  automate the server through Hostinger's API.

What is missing matters as much as what is present. No CDN, no automatic SSL
and no mailboxes. Each of those is something you install or buy separately.

## Who this plan is right for

KVM 1 fits people who already think in terms of servers. A developer who wants
a cheap box to run a side project, an API or a Discord bot. Someone who wants
to self-host a VPN, a Git server, an uptime monitor or a small database. A
technical founder who wants to learn server administration on real hardware
without spending $20 a month.

It also fits a specific kind of small website: a static site or a lightly
visited WordPress install that a competent administrator wants to run with
exactly the stack they choose, rather than whatever a managed host provides.

## Where this plan starts to hurt

The single vCPU is the first wall. Compiling a large project, transcoding
video, running a heavy cron job — anything that pins the CPU — will make the
whole server feel slow while it runs. If your workload is CPU-bound rather than
memory-bound, [KVM 2](/plans/kvm-2/) and its two cores are the minimum.

The second wall is operational. Everything that is automatic on shared hosting
is manual here. The OS needs patching. The firewall needs rules. Certificates
need renewal. Backups need verifying. None of that is difficult, but all of it
is your job, and skipping it is how servers get compromised.

The third is email. There is no mailbox allowance and no SMTP relay. Running
your own mail server on a new VPS is possible but painful — deliverability
depends on IP reputation you do not yet have. If you need business email, keep
it on a hosted plan and point your DNS at this server for everything else.

Networking is worth a note too. The 1 Gbps port and 4 TB of transfer are
generous, but the IP address you are issued is new and unproven. Reputation has
to be earned, and a fresh server has none. That affects email most of all, but
it also matters if you plan to call third-party APIs that rate-limit by IP.

> Rule of thumb: if you cannot describe what you would do when SSH stops
> responding, you are not ready for an unmanaged VPS. Start on a managed plan
> and move up when you can answer that question.

## How it compares to the plan below and above

| | KVM 1 | KVM 2 | Cloud Startup |
| --- | --- | --- | --- |
| Monthly (term) | $6.49 (24 mo) | $8.99 (24 mo) | $7.99 (48 mo) |
| Type | Self-managed VPS | Self-managed VPS | Managed cloud |
| vCPU cores | 1 | 2 | 4 (shared model) |
| RAM | 4 GB | 8 GB | 4 GB |
| Storage | 50 GB NVMe | 100 GB NVMe | 100 GB NVMe |
| Transfer | 4 TB | 8 TB | Unmetered |
| Root access | Yes | Yes | No |
| Managed WordPress | No | No | Yes |
| Bundled email | No | No | Yes |
| Renewal | $11.99 | $14.99 | $25.99 |

Compared with [Cloud Startup](/plans/cloud-startup/), the trade is control
against convenience. Cloud Startup gives you managed WordPress, email, SSL and
a CDN for a similar monthly price, but no root access and no dedicated
resources. KVM 1 gives you root and isolation, but you build everything on top
of it yourself.

Compared with [KVM 2](/plans/kvm-2/), the extra $2.50 a month buys a second
core, twice the RAM, twice the storage and twice the transfer. It is the better
value of the two and the plan most people should pick if they are choosing a
VPS at all.

## How to buy it without overpaying

1. **Take the 24-month term for the $6.49 rate.** $155.76 upfront is a modest
   commitment and the renewal jump to $11.99/mo is smaller than on shared
   hosting.
2. **Choose your OS template carefully at checkout.** Rebuilding later means
   wiping the server, so pick the distribution you actually intend to run.
3. **Claim the free domain in year one** and point its DNS at your server's IP.
4. **Install your own SSL.** Certbot or Caddy will issue and renew Let's
   Encrypt certificates automatically once configured.
5. **Put a CDN in front of anything public.** None is included, and a free
   tier from a third party will absorb most of your static traffic.
6. **Test a backup restore in the first week.** Weekly backups are only useful
   if you know how to bring one back. If you outgrow the weekly window, use
   our [hosting cost calculator](/tools/hosting-cost-calculator/) to check
   whether [KVM 2](/plans/kvm-2/) or an external backup service is cheaper.
