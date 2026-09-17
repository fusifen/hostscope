---
title: "How to Migrate a Website to Hostinger Without Downtime"
description: "Hostinger's free automatic migration, when to use it, and a step-by-step DIY migration path with a pre-flight checklist and a rollback plan."
pubDate: 2026-03-19
updatedDate: 2026-09-16
author: "priya-nair"
category: "tutorial"
tags: ['migration', 'wordpress', 'dns', 'backup', 'downtime']
primaryKeyword: "migrate website to hostinger"
affiliateNotice: true
featured: false
readingTime: 8
relatedPlans: ['premium', 'unlimited', 'cloud-startup']
relatedArticles: ['how-to-point-a-domain-to-hostinger', 'how-to-install-wordpress-on-hostinger', 'hostinger-free-ssl-setup', 'hpanel-beginner-guide']
steps:
  - name: "Take a full backup of the current site"
    text: "Export the database and download the entire file tree before you touch anything else. Keep both off the current server. This backup is your rollback, and it is the only step you cannot skip."
  - name: "Decide between the free migration service and doing it yourself"
    text: "Hostinger's team will move the site for you at no cost if you submit a request, usually in about 20 minutes, with the site staying online throughout. Do it yourself if you want control, if you are moving something other than a standard WordPress site, or if you want to learn the process."
  - name: "Submit a migration request if you are using the service"
    text: "Provide the source host, the login details and the domain. The team copies files and the database across, then tells you when it is done. You then switch DNS at your own pace."
  - name: "Upload the files to public_html"
    text: "Connect over FTP or use the hPanel file manager and upload the site files into public_html. If you are uploading an archive, upload the zip and extract it in place rather than transferring thousands of small files."
  - name: "Create the database and import the dump"
    text: "Create a new database and user in the Databases section, then open phpMyAdmin and import the SQL file exported from the old host. Note the new database name, user and password, because they will differ from the originals."
  - name: "Edit wp-config.php with the new credentials"
    text: "Open wp-config.php in the file manager and update DB_NAME, DB_USER, DB_PASSWORD and DB_HOST. Also update the table prefix if you changed it. A wrong value here produces the white screen or the database connection error."
  - name: "Update the site URL in the database"
    text: "Run a search-and-replace across the database to change the old domain to the new one, using a tool that handles serialised data correctly. Never do this with a plain find-and-replace, which corrupts serialised options."
  - name: "Test the site before switching DNS"
    text: "Either add a hosts file entry on your own machine pointing the domain at the new server, or use a temporary domain, so you can load the migrated site without affecting anyone else. Click through pages, forms, logins and checkout."
  - name: "Switch DNS and watch for 48 hours"
    text: "Lower the TTL in advance, point the domain at Hostinger, then keep the old host running for a week. Watch error logs, check email delivery, and confirm SSL issues on the new server before you cancel anything."
faqs:
  - question: "Is Hostinger's website migration really free?"
    answer: >-
      Yes. Hostinger offers free automatic website migration on its hosting
      plans. You submit a request with the source host details and the team
      moves the files and database for you, usually in about 20 minutes, with
      the site staying online the whole time.
  - question: "Will my site go down during migration?"
    answer: >-
      Not if you do it in the right order. Copy the files and database to
      Hostinger first, test the site there, and only then change DNS. The old
      server keeps serving visitors until the DNS change propagates, so there is
      no window where neither server has the site.
  - question: "Can I migrate a site that is not WordPress?"
    answer: >-
      Yes. The manual path — upload files to public_html, import the database,
      update the configuration file — works for any PHP application. The free
      migration service is best suited to standard WordPress, WooCommerce and
      common CMS installs, so check with support first for anything unusual.
  - question: "How do I test the migrated site before changing DNS?"
    answer: >-
      Two options. Add an entry to your local hosts file mapping the domain to
      Hostinger's IP, which affects only your machine. Or attach a temporary
      domain or subdomain to the site in hPanel and browse it there. The hosts
      file approach tests the real domain name, which matters for WordPress
      because it stores absolute URLs.
  - question: "What should I do if the migration goes wrong?"
    answer: >-
      Point DNS back at the old server. Because the old host is still running
      and still has a complete copy, the rollback is a DNS change plus the TTL
      wait, not a restore. This is why you keep the old hosting active for at
      least a week after the switch.
  - question: "How long does DNS take after a migration?"
    answer: >-
      Usually minutes to a couple of hours, with 48 hours as the theoretical
      ceiling. Lower the TTL on your records to 300 seconds a day before the
      switch so the window is short for everyone, not just for visitors whose
      resolvers happen to be fast.
  - question: "Do I need to reinstall WordPress after migrating?"
    answer: >-
      No. The migration moves the existing install, including themes, plugins
      and content. Do not run the one-click installer on the destination domain
      first, or you will overwrite the files you just uploaded and end up with
      two installs fighting over one database.
---

## The short answer

Hostinger migrates websites for free. You submit a request, their team moves the files and database, and it usually takes about 20 minutes with no downtime for visitors. If you are moving a standard WordPress site and you do not care how the sausage is made, that is the correct choice and you can stop reading after the next section.

If you want to do it yourself — because the site is unusual, because you want to control the timing, or because you want to understand your own setup — the manual path is below, along with the checklist and the rollback plan that make it safe.

## Option 1: the free automatic migration

Hostinger's automatic website migration is included with its hosting plans and does not cost extra. The flow is short.

1. Submit a migration request from within hPanel, giving the source host, the credentials it needs, and the domain you are moving.
2. The team copies your files and database to your Hostinger account.
3. They tell you when it is done and you review the site.
4. You switch DNS when you are ready.

Two things make this genuinely low-risk. First, the old site stays online the entire time — the copy is made while it is serving traffic, so nobody sees a maintenance page. Second, the timing of the switch is yours, so you can migrate on a Tuesday and cut over on a Saturday morning when traffic is lowest.

The service suits standard WordPress, WooCommerce and common CMS installs. If you are running a custom PHP application, a Node.js service or something with unusual server requirements, ask support before you assume it is covered — and note that Node.js hosting is not available on [Premium](/plans/premium/) at all, though Unlimited supports five Node.js sites and Cloud Startup supports ten.

## Option 2: the DIY migration

Doing it yourself is eight steps, and only the last one is visible to your visitors.

### Step 1: back up everything

Export the database and download the entire file tree from the old host. Keep both somewhere other than the old server — a local drive, cloud storage, anywhere.

This is your rollback. If you skip it and something breaks at step 7, you will be reconstructing a site from memory.

### Step 2: gather what you will need

| Item | Where to find it | Why you need it |
| --- | --- | --- |
| Database dump | phpMyAdmin → Export | Content, users, settings, plugin data |
| Full file tree | FTP or file manager | Themes, plugins, uploads, config |
| Current `wp-config.php` | Site root | Source of salts and the old table prefix |
| Domain list | Old host panel | Addon domains and subdomains also need moving |
| Mailbox list | Old host panel | Email is separate from the website and easy to forget |
| DNS records | Old DNS zone | Screenshot everything before you change nameservers |

That last row is the one people regret. Screenshotting the DNS zone takes thirty seconds and prevents the classic outcome where the website works perfectly after migration and the email stops.

### Step 3: upload the files

Connect over FTP or use the hPanel file manager and upload into `public_html`. If you have more than a few hundred files, upload a single zip archive and extract it in place — transferring tens of thousands of small files over FTP is slow and often times out partway through, leaving you with a half-uploaded site and no clear indication of where it stopped.

### Step 4: create the database and import

In **Databases**, create a new database and a user with a strong password, and attach the user to the database with full privileges. Then open phpMyAdmin, select the database, and import the SQL dump.

Expect the new database name, username and password to be different from the old ones. They always are.

### Step 5: edit wp-config.php

Open `wp-config.php` in the file manager and update four constants.

- `DB_NAME` — the new database name
- `DB_USER` — the new database user
- `DB_PASSWORD` — the new password
- `DB_HOST` — usually `localhost`

While you are in there, check `$table_prefix`. If the old site used something other than `wp_`, the value must match or WordPress will look for tables that do not exist.

Get one of these wrong and you will see "Error establishing a database connection" or a blank white page. Both mean the same thing.

### Step 6: update the site URL

WordPress stores absolute URLs in the database — in post content, widget settings, theme options and serialised arrays. If the domain is changing, every one of those needs updating.

Use a search-and-replace tool that understands serialised data, such as the one built into WP-CLI or a migration plugin. A plain SQL `REPLACE` or a text editor find-and-replace will corrupt serialised values, because serialised strings carry a length prefix and changing the string without updating the length breaks the structure. The symptom is subtle: the site loads, but settings silently disappear or a widget renders as a blank box.

If the domain is not changing — you are moving hosting but keeping the URL — you can skip this step entirely.

> A rule that saves migrations: never do a search-and-replace on a live database without a fresh export taken minutes beforehand. Serialised data is unforgiving, and the difference between a five-minute fix and a rebuild is whether you have that dump.

### Step 7: test before you switch

You need to load the migrated site without changing anything for real visitors. Two ways.

**The hosts file override.** Add a line to your local hosts file mapping the domain to Hostinger's IP address:

```
203.0.113.10  example.com
203.0.113.10  www.example.com
```

Replace that address with your actual hosting IP. This affects only your machine, so you can browse the real domain name and see the new server. Remember to remove the entry afterwards, or you will be confused by your own testing for weeks.

The hosts file approach is better for WordPress than a temporary domain, because WordPress generates links using the configured site URL. Testing on a temporary domain means either changing the site URL back and forth or accepting broken links and missing styles.

**A temporary domain.** Attach a subdomain to the site in hPanel and browse that. Simpler, but expect some assets to load from the old domain until you finish the URL update.

Either way, click through more than the homepage: log in to the admin, submit a contact form, complete a test order, and check that images in older posts still resolve.

### Step 8: switch DNS

Lower the TTL on your records to 300 seconds at least a day in advance, then point the domain at Hostinger. The full mechanics are in our [domain pointing guide](/blog/how-to-point-a-domain-to-hostinger/), including the difference between changing nameservers and adding an A record.

After the switch, keep the old host running for at least a week. You are paying for a week of insurance.

## The pre-migration checklist

Run through this before you start, not during.

- Full backup of files and database, stored off the old server
- Screenshot of the current DNS zone, including MX, TXT and any verification records
- List of all domains and subdomains on the old account
- List of mailboxes, forwarders and autoresponders
- Inventory of cron jobs and scheduled tasks
- Note of the PHP version and any non-default extensions the site depends on
- Confirmation that the destination plan has enough disk space — 20 GB SSD on Premium, 50 GB NVMe on Unlimited, 100 GB NVMe on Cloud Startup
- A low-traffic window chosen for the DNS switch
- Someone available to watch the site for the first hour after the switch

## The rollback plan

The rollback is short, which is the point.

Point DNS back at the old server. If the old hosting is still active and still holds the site, that is the entire recovery — the change propagates within your TTL window and visitors are back on the working copy. Nothing needs restoring because nothing was deleted.

This only works if you kept the old host running. Cancelling it on switch day converts a two-minute rollback into a full restore from backup, and it is the single decision that most often turns a routine migration into a bad week.

## After the switch

Once the site is live on Hostinger, work through the standard setup: confirm SSL has been issued and enable force HTTPS, install LiteSpeed Cache, and check that email is still flowing if the mailboxes moved too. Our [WordPress installation guide](/blog/how-to-install-wordpress-on-hostinger/) covers the hardening steps in order, and the [SSL guide](/blog/hostinger-free-ssl-setup/) explains what to do if the certificate does not issue within the first couple of hours. If you are weighing up whether to move to [Unlimited](/plans/unlimited/) for the daily backups and dedicated IP rather than staying on Premium, our [plan pages](/plans/) lay out the differences without the marketing gloss.
