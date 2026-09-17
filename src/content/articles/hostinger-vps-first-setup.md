---
title: "Your First Hostinger VPS: OS Choice, Panel and Hardening"
description: "Set up a Hostinger KVM VPS properly: pick an OS template, log in with SSH keys, create a sudo user, configure the firewall, and choose a control panel."
pubDate: 2026-04-22
updatedDate: 2026-09-16
author: "daniel-okafor"
category: "tutorial"
tags: ['vps', 'kvm', 'ssh', 'hardening', 'cyberpanel', 'docker']
primaryKeyword: "hostinger vps setup"
affiliateNotice: true
featured: false
readingTime: 9
relatedPlans: ['kvm-1', 'kvm-2', 'kvm-4', 'kvm-8']
relatedArticles: ['hpanel-beginner-guide', 'hostinger-free-ssl-setup', 'how-to-point-a-domain-to-hostinger', 'how-to-migrate-a-website-to-hostinger']
steps:
  - name: "Pick a plan based on the workload, not the price"
    text: "KVM 1 gives you 1 vCPU, 4 GB RAM and 50 GB NVMe; KVM 8 gives you 8 vCPU, 32 GB RAM and 400 GB NVMe. Choose from what you are going to run, and remember every plan is self-managed, so there is no support team to configure the software for you."
  - name: "Choose an OS template or a 1-click app"
    text: "Pick a clean operating system such as Ubuntu LTS or AlmaLinux if you plan to configure the stack yourself. Pick a 1-click application template if you want a specific stack installed for you. Reinstalling the OS later wipes the server, so decide before you put data on it."
  - name: "Find the server in the VPS dashboard"
    text: "Your VPS appears in the VPS section of hPanel, but the server itself is managed from the VPS dashboard, not from hPanel. That is where you reinstall the OS, set firewall rules, take snapshots and read the root password or SSH key details."
  - name: "Log in over SSH with a key, not a password"
    text: "Generate an ed25519 key pair on your own machine, add the public key to the server when you create it or afterwards through the dashboard, and connect as root once to confirm access. Key authentication is both stronger and more convenient than a password."
  - name: "Create a non-root sudo user"
    text: "Add a user with adduser, give it sudo rights, and copy your public key into its home directory. From then on, work as that user and escalate with sudo only when you need to."
  - name: "Disable password login and direct root SSH"
    text: "Edit the SSH daemon configuration to set PasswordAuthentication no and PermitRootLogin no, then restart the SSH service. Keep your existing session open while you test a new connection in a second terminal, so you cannot lock yourself out."
  - name: "Configure the firewall"
    text: "Allow SSH first, then the ports your services need. On Ubuntu and Debian use ufw; on AlmaLinux and Rocky use firewalld. Also review the firewall rules in the VPS dashboard, which operate at a different layer and can block traffic before your server sees it."
  - name: "Enable unattended security updates"
    text: "Install unattended-upgrades on Debian-family systems or dnf-automatic on Red Hat-family systems and enable the security repository. Kernel updates still need a reboot, so schedule one during a maintenance window."
  - name: "Choose a control panel or skip it"
    text: "CyberPanel, CloudPanel, cPanel and plain Docker are all reasonable answers. Install a panel if you want a web interface for sites, databases and certificates. Skip it if you are running containers and would rather manage the stack as code."
faqs:
  - question: "Is Hostinger VPS managed or self-managed?"
    answer: >-
      Self-managed. Hostinger handles the hardware, the network and the
      hypervisor, and gives you full root access to the operating system. You
      are responsible for everything inside the server: updates, firewall,
      software, backups of application data and security.
  - question: "Do I use hPanel to manage a VPS?"
    answer: >-
      Only to reach it. The VPS appears in hPanel's sidebar, but the server is
      managed from the VPS dashboard, which handles OS reinstalls, firewall
      rules, snapshots and SSH key details. hPanel itself manages Hostinger's
      shared, cloud and email products.
  - question: "Which operating system should I choose for a Hostinger VPS?"
    answer: >-
      Ubuntu LTS if you want the largest supply of tutorials and the smoothest
      path with Docker and modern web stacks. AlmaLinux or Rocky Linux if you
      prefer the Red Hat family and long support cycles. Debian if you want
      something minimal and stable. All three are well supported.
  - question: "Do I need a control panel on a VPS?"
    answer: >-
      No, but it saves time if you host websites rather than containers.
      CloudPanel is fast and free for PHP and Node sites, CyberPanel adds a
      mail server and a free tier, cPanel is the industry standard but requires
      a paid licence, and Docker suits people who would rather define the stack
      in a compose file than click through a UI.
  - question: "How do I stop password login on SSH?"
    answer: >-
      Edit the SSH daemon configuration, set PasswordAuthentication to no and
      PermitRootLogin to no, then restart the SSH service. Add your public key
      to the account you will log in as before you do this, and test a fresh
      connection in a second terminal while your current session is still open.
  - question: "Are Hostinger VPS backups automatic?"
    answer: >-
      Every VPS plan includes free weekly backups, and you can take manual
      snapshots from the VPS dashboard before making risky changes. Weekly
      server-level backups are not a substitute for backing up your application
      data somewhere else, especially databases.
  - question: "What is the difference between KVM 1 and KVM 8?"
    answer: >-
      KVM 1 has 1 vCPU, 4 GB RAM, 50 GB NVMe and 4 TB of bandwidth. KVM 8 has
      8 vCPU, 32 GB RAM, 400 GB NVMe and 32 TB of bandwidth. KVM 1 suits a
      single small site or a test box; KVM 8 runs multiple production
      applications or a busy database.
---

## What you are actually buying

A Hostinger VPS is a KVM virtual machine with full root access and no managed layer on top. Hostinger runs the hardware, the network and the hypervisor. Everything inside the operating system — updates, firewall rules, the web server, the database, backups of your own data — is yours.

That is the trade. You get more control and more performance per dollar than shared hosting, and in exchange nobody is going to fix your broken nginx config at 2am. If that sentence sounds like a bad deal, a [Cloud Startup plan](/plans/cloud-startup/) is the better answer and you can stop here.

If it sounds fine, the rest of this guide is the setup order that avoids the mistakes people make in their first week.

## Choosing a plan

Every KVM plan includes AMD EPYC processors, NVMe storage, a 1 Gbps network, one IPv4 and one IPv6 address, full root access, a free domain for the first year, free weekly backups, firewall management, an AI web terminal and a public API.

| Plan | Specs | Promo price | Renewal | Bandwidth | Fits |
| --- | --- | --- | --- | --- | --- |
| KVM 1 | 1 vCPU, 4 GB RAM, 50 GB NVMe | $6.49/mo | $11.99/mo | 4 TB | One small site, a staging box, a VPN, a bot, a learning environment |
| KVM 2 | 2 vCPU, 8 GB RAM, 100 GB NVMe | $8.99/mo | $14.99/mo | 8 TB | One production site with a database, a small Node.js or Python app, a couple of containers |
| KVM 4 | 4 vCPU, 16 GB RAM, 200 GB NVMe | $12.99/mo | $28.99/mo | 16 TB | Several sites behind one panel, a mid-sized application, a self-hosted service stack |
| KVM 8 | 8 vCPU, 32 GB RAM, 400 GB NVMe | $25.99/mo | $49.99/mo | 32 TB | Multiple production apps, a busy database, CI runners, heavy container workloads |

Two things about those numbers. The promotional rates require the 24-month term paid upfront, and the renewal rate is what you will actually pay in year three — the gap between $8.99 and $14.99 on KVM 2 is the one that catches people. Second, RAM is usually the constraint that arrives first, not CPU. A LAMP stack with a panel idles at around 1 GB, so KVM 1's 4 GB is comfortable for one site and tight for two.

> A rule of thumb worth trusting: size for memory first, then CPU. Most small VPS problems are the out-of-memory killer arriving silently at 3am, not a CPU bottleneck.

## The OS decision

You choose a template when you create the server, and reinstalling later wipes everything, so it is worth thirty seconds of thought.

| Option | Choose it when |
| --- | --- |
| Ubuntu LTS | You want the largest body of tutorials and the smoothest Docker and modern-stack experience |
| AlmaLinux or Rocky Linux | You prefer the Red Hat family, long support cycles and `dnf` |
| Debian | You want something minimal and stable and you know your way around Linux |
| A 1-click application template | You want a specific stack preinstalled and would rather not build it |

Pick a clean OS if you intend to install a control panel, because the panels expect to own the web server configuration. Pick a 1-click app if you want one thing running quickly and do not plan to customise much underneath it.

## The dashboard is not hPanel

This confuses almost everybody at first. Your VPS shows up in hPanel's sidebar, but hPanel manages Hostinger's shared, cloud and email products. The server itself is managed from the **VPS dashboard**, which is where you:

- Reinstall or change the operating system
- Read the root password or add an SSH key
- Set firewall rules at the network layer
- Take snapshots and restore them
- Watch CPU, RAM, disk and bandwidth graphs

If you cannot find a server setting in hPanel, it is in the VPS dashboard. Our [hPanel tour](/blog/hpanel-beginner-guide/) covers what the shared-hosting side of the panel does, and the two do not overlap.

## Hardening, in the right order

Do these five things before you install anything else. Each one takes a few minutes and each one removes a class of problem permanently.

### 1. SSH key authentication

Generate an ed25519 key pair on your own machine:

```
ssh-keygen -t ed25519 -C "you@laptop"
```

Add the public key to the server when you create it, or afterwards through the VPS dashboard. Then confirm you can log in with the key before you change anything else — this is the step where people lock themselves out by disabling passwords first.

### 2. A non-root user

Create a normal account and give it sudo rights:

```
adduser deploy
usermod -aG sudo deploy
```

Copy your public key into `/home/deploy/.ssh/authorized_keys` and set the permissions to `700` on the directory and `600` on the file. From now on you log in as `deploy` and escalate with `sudo` when needed. Working as root for everything means one mistyped command can destroy the server instead of returning permission denied.

### 3. Turn off password login

Edit `/etc/ssh/sshd_config` and set:

```
PasswordAuthentication no
PermitRootLogin no
```

Restart the SSH service. Now keep your current session open and open a second terminal to test a fresh connection. If the new connection works, close the first one. If it does not, you still have a session in which to fix the mistake — which is the entire reason for testing this way.

### 4. The firewall

Allow SSH before anything else, or you will lock yourself out of a remote machine.

On Ubuntu and Debian:

```
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

On AlmaLinux and Rocky, use `firewall-cmd` with the equivalent rules.

Then check the firewall in the VPS dashboard as well. It operates at a different layer and can drop traffic before it reaches your server, which produces the confusing situation where your server's rules say the port is open and connections still time out.

### 5. Unattended security updates

Install `unattended-upgrades` on Debian-family systems or `dnf-automatic` on Red Hat-family systems and enable the security repository. This handles the steady stream of package vulnerabilities without you remembering to run updates.

Kernel updates still need a reboot, so either schedule one or configure automatic reboots during a maintenance window. A server that has been up for four hundred days is not a badge of honour; it is a machine running a four-hundred-day-old kernel.

## Choosing a control panel

You do not need one, but if you are hosting websites rather than containers, one will save you a lot of time.

| Panel | Suits | Notes |
| --- | --- | --- |
| CloudPanel | PHP, Node.js and static sites | Free, fast, deliberately minimal. Good default for a web-hosting VPS |
| CyberPanel | Sites plus mail | Free tier available, built on OpenLiteSpeed, includes mail server tooling |
| cPanel | People who already know cPanel | The industry standard, but it is a licensed product, so it adds a recurring cost on top of the server |
| Docker | Application and container workloads | Not a panel. Best when the stack is defined in a compose file and deployed from a repository |

The pattern that works: if you are replacing shared hosting with a VPS to host a few websites, install CloudPanel and stop thinking about it. If you need mail, CyberPanel. If you are building an application and deploying from Git, skip the panel and use Docker.

Whichever you choose, install it on a clean OS, and take a snapshot from the VPS dashboard before you do. Snapshots are the fastest rollback available and they cost you nothing but a couple of minutes.

## Domain, DNS and TLS

Point the domain at the VPS's IP address, either by changing nameservers or by adding an A record — both routes are covered in our [domain pointing guide](/blog/how-to-point-a-domain-to-hostinger/). Unlike shared hosting, there is no automatic SSL here: your panel handles certificates, and most panels issue and renew Let's Encrypt certificates for you once DNS resolves.

If you are running Docker without a panel, use a reverse proxy such as Caddy or Traefik for automatic certificate issuance rather than managing certificates by hand.

## Where the VPS stops making sense

A self-managed VPS is the wrong purchase if you want someone else to handle updates, if you are not comfortable in a terminal, or if the site is a business asset that cannot afford you being unavailable. The performance is real, but so is the responsibility.

If you are still deciding, the honest comparison is between a $12.99 KVM 4 and a [Cloud Startup plan](/plans/cloud-startup/) at $7.99 with 4 CPU cores, 4 GB RAM and 100 GB NVMe — on paper the managed plan wins on price and resources, and the VPS wins on control. The [plan comparison](/plans/) lays the specs side by side, and the [plan finder](/tools/plan-finder/) will tell you which side of that line you are on in about thirty seconds.
