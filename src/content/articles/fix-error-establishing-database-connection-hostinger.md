---
title: "Fixing 'Error Establishing a Database Connection' on Hostinger"
description: "Why WordPress loses its database on Hostinger and how to fix it: credentials, user permissions, host name, size limits, corrupted tables and phpMyAdmin repair."
pubDate: 2026-03-27
updatedDate: 2026-09-16
author: "priya-nair"
category: "troubleshooting"
tags: ['database connection error', 'hostinger wordpress', 'wp-config', 'phpmyadmin']
primaryKeyword: "error establishing a database connection hostinger"
affiliateNotice: true
featured: false
readingTime: 9
relatedPlans: ['premium', 'unlimited', 'cloud-startup']
relatedArticles: ['fix-wordpress-white-screen-hostinger', 'fix-hostinger-503-error', 'hostinger-website-slow-fix']
steps:
  - name: "Confirm whether it is only your site"
    text: "If every site on the account shows the same error, suspect a server-side issue and check Hostinger's status page or support chat. If only one site is affected, the problem is in that site's configuration or database."
  - name: "Check the credentials in wp-config.php"
    text: "Open wp-config.php in the file manager and compare DB_NAME, DB_USER, DB_PASSWORD and DB_HOST against the values in hPanel's database area. A password changed in hPanel but not in the file is the most common cause."
  - name: "Check the database host value"
    text: "Confirm DB_HOST is the value shown in hPanel for your site. Some setups use localhost and some use a specific hostname. Using the wrong one produces exactly this error."
  - name: "Confirm the user is attached to the database"
    text: "In hPanel's MySQL database area, check that the database user is listed as a user of that database with the required privileges. A user that exists but is not attached cannot connect."
  - name: "Check the database size and count limits"
    text: "Confirm you are within the plan limits — 3 GB per database on Premium and Unlimited, 6 GB on Cloud Startup, with a maximum of 10, 150 and 300 databases respectively."
  - name: "Repair corrupted tables"
    text: "Open phpMyAdmin from hPanel, select the database, tick the tables and run a repair. A crashed table returns a connection error even when the credentials are correct."
  - name: "Restore from a backup if repair fails"
    text: "Premium has weekly backups; Unlimited and above have daily backups plus easy restore. Restore the most recent good copy if the database cannot be repaired."
faqs:
  - question: "Why does WordPress say 'Error Establishing a Database Connection'?"
    answer: >-
      WordPress could not log in to MySQL. The usual causes are wrong
      credentials in wp-config.php, a database user that is not attached to the
      database, the wrong database host value, a server-side outage, a plan
      limit, or a corrupted table.
  - question: "What should DB_HOST be on Hostinger?"
    answer: >-
      Use exactly the value shown in hPanel's database area for your site. Some
      configurations use localhost and others use a specific hostname. Copy it
      rather than assuming.
  - question: "How large can a Hostinger database be?"
    answer: >-
      Premium and Unlimited allow 3 GB per database and Cloud Startup allows
      6 GB. Cloud Professional allows 9 GB and Cloud Enterprise 12 GB.
  - question: "How many databases does each Hostinger plan include?"
    answer: >-
      Premium includes 10 databases, Unlimited includes 150 and Cloud Startup
      includes 300. Cloud Professional, Enterprise and Enterprise Plus each
      include 300.
  - question: "Can I repair a corrupted database table on Hostinger?"
    answer: >-
      Yes. Open phpMyAdmin from hPanel, select the affected database, tick the
      tables and run a repair. If repair fails, restore the database from a
      backup instead.
  - question: "Does changing my Hostinger account password break the database?"
    answer: >-
      Changing the database user's password in hPanel will break the connection
      until you update DB_PASSWORD in wp-config.php to match. The two must always
      agree.
---

## What the error means

WordPress cannot reach its database. It has nothing to do with the web server,
the theme or the plugins — the site cannot even load its own settings, so it
stops and prints that single line.

The cause is one of six things, and they are quick to tell apart. Work through
them in the order below; the first two account for most cases.

> The fastest split: if every site on your Hostinger account shows the same
> error at the same time, it is a server-side problem and you should be talking
> to support, not editing files. If only one site is affected, it is that site's
> configuration or database.

## 1. Wrong credentials in `wp-config.php`

WordPress stores four values in `wp-config.php`: database name, user, password
and host. If any one of them is wrong, the connection fails.

The values are shown in hPanel's MySQL database area. Open `wp-config.php` in
the file manager and compare them, character by character.

```php
define( 'DB_NAME', 'your_database_name' );
define( 'DB_USER', 'your_database_user' );
define( 'DB_PASSWORD', 'your_database_password' );
define( 'DB_HOST', 'the_host_shown_in_hpanel' );
```

The most common trigger is a password change. If someone changes the database
user's password in hPanel, the site keeps using the old password from
`wp-config.php` and dies instantly. The same happens if the database was renamed,
or if the site was migrated from another host and the old credentials came with
it.

A subtler version: the database name and user name often carry a prefix in
hPanel. If the panel shows the database as `u123456_wp`, then `u123456_wp` is
what belongs in the file, not `wp`. Copy and paste rather than typing.

### If you are unsure, reset the password deliberately

In hPanel, set a new password for the database user, then update
`DB_PASSWORD` in `wp-config.php` to the same value. Doing both together removes
the ambiguity. Use a password without characters that need escaping in PHP —
quotes and backslashes in particular, because they break the config file syntax.

## 2. The user is not attached to the database

In MySQL, a user account and a database are separate objects. A user must be
granted access to a specific database, and if that grant is missing or was
removed, the login fails even though the credentials are correct.

Open the MySQL database area in hPanel and look at the list of users for the
database in question. If your database user is not listed there, add it and
grant it the required privileges.

This happens more often than people expect after a migration or after someone
tidies up the user list. It also happens when a database is created in hPanel but
the user is created separately and never attached.

## 3. The wrong `DB_HOST` value

`DB_HOST` is not always `localhost`. On some Hostinger configurations it is a
specific hostname, and using `localhost` where a hostname is required produces
exactly this error.

Copy the value from hPanel rather than assuming. If hPanel shows a hostname,
use it. If it shows `localhost`, use that.

A related trap: some configurations expect `localhost` and reject `127.0.0.1`, or
the reverse. They are not always interchangeable. Use what the panel shows.

## 4. MySQL is briefly unavailable

Occasionally the database server restarts — during maintenance, during a
migration, or after a resource spike. During that window every site using that
server returns the connection error.

How to tell: the error appears suddenly with no configuration change, and it
disappears on its own within minutes. Reload a few times over a ten-minute
period. If it clears without you touching anything, that was the cause.

If it does not clear, check Hostinger's status page and open a support chat. Live
chat first response on English requests is typically around a minute, which
makes it a fast way to confirm whether an incident is in progress.

## 5. You have hit a plan limit

Two hard limits can cause this error: database size and database count.

| Plan | Databases | Size per database | Database-driven ceiling |
| --- | --- | --- | --- |
| Premium | 10 | 3 GB | 10 sites max with one database each |
| Unlimited | 150 | 3 GB | Ample for most multi-site setups |
| Cloud Startup | 300 | 6 GB | Room for large stores and multi-site |
| Cloud Professional | 300 | 9 GB | Large catalogues |
| Cloud Enterprise | 300 | 12 GB | Very large datasets |

The size limit is the one that bites. A WooCommerce store that has been running
for years accumulates order meta, sessions, logs and transients. Reaching 3 GB is
not unusual for a busy shop on Premium or Unlimited, and when the database
reaches the ceiling, writes fail and the connection can fail with it.

Signs you are near the limit:

- The database error appears during order processing or comment posting, not on
  every page load.
- phpMyAdmin reports a large database size relative to the plan allowance.
- The site has been running for years without a database cleanup.

If you are near the limit, clean before you upgrade. Delete expired transients,
clear old sessions and logs, remove orphaned post meta, and drop plugin tables
belonging to plugins you uninstalled. A cleanup can reclaim a surprising amount,
and it is free.

## 6. Corrupted tables

A table that crashed — usually because a write was interrupted by a restart, a
disk event or a timeout — returns a connection error even when everything else is
correct.

WordPress is especially exposed because it writes to several tables per page
load. A single crashed table in the options or posts table takes the whole site
down.

### How to repair tables with phpMyAdmin

1. In hPanel, open the **Databases** area and launch phpMyAdmin for the database.
2. Select the database in the left-hand list.
3. Scroll to the bottom of the table list. You may see a message naming specific
   tables as crashed.
4. Tick the checkbox at the top of the list to select all tables.
5. In the dropdown labelled "With selected", choose **Repair table** and run it.
6. If repair does not fix it, run **Check table** first to confirm the diagnosis,
   then try repair again.
7. Reload the site.

If repair fails on a table, the next step is restore rather than further
attempts. A table that will not repair is usually damaged beyond what the repair
operation can recover.

> Repair first, restore second. Repair is non-destructive and takes a minute.
> Restoring overwrites the current database with an older copy, which means
> losing everything written since that backup — so try the cheap option before
> the expensive one.

## 7. Restoring from a backup

If the credentials are correct, the user is attached, the host value is right and
the tables will not repair, restore.

Backup frequency depends on the plan, and this is where it matters:

- **Premium includes weekly backups.** The most recent restore point may be up
  to six days old, so a restore can cost you a week of content and orders.
- **Unlimited and above include daily backups** plus an easy restore. Cloud
  Startup adds on-demand backups.

Find the backup area in hPanel's file or website management section, pick a
restore point from before the error appeared, and restore. Then re-apply any
changes made since.

The upgrade from Premium to Unlimited costs $1/mo more on the 48-month term and
changes backups from weekly to daily. For any site that takes orders, that is the
cheapest risk reduction available — the [Unlimited plan breakdown](/plans/unlimited/)
covers the rest of the differences.

## A recovery checklist

1. Confirm whether the error affects one site or every site on the account.
2. If every site: check the status page and contact support.
3. Compare `DB_NAME`, `DB_USER`, `DB_PASSWORD` and `DB_HOST` against hPanel.
4. Confirm the user is attached to the database with the right privileges.
5. Confirm `DB_HOST` matches what hPanel shows, exactly.
6. Reload over ten minutes to rule out a transient server restart.
7. Check database size against the plan limit and clean if close.
8. Repair tables in phpMyAdmin.
9. Restore from the most recent good backup.
10. Change one thing at a time so you know which one fixed it.

## Preventing it

- **Update `wp-config.php` whenever you change a database password.** Do both in
  the same sitting.
- **Set a calendar reminder for a quarterly database cleanup.** Delete
  transients, sessions, spam comments and orphaned meta.
- **Watch the database size.** If you are approaching the 3 GB limit on Premium
  or Unlimited, plan the move before the site goes down rather than after.
- **Do not delete database users you do not recognise** until you have confirmed
  no site is using them.
- **Take a manual export before plugin updates.** A phpMyAdmin export of the
  database takes a couple of minutes and covers the case a weekly backup does
  not.

If the page is blank rather than showing a database error, the
[white screen guide](/blog/fix-wordpress-white-screen-hostinger/) covers fatal
PHP errors. If the site returns a 503 instead, start with the
[503 error guide](/blog/fix-hostinger-503-error/). And for the wider picture of
what each tier includes — database counts, sizes, PHP workers and backups — see
the [pricing comparison](/pricing/) or the
[Cloud Startup plan page](/plans/cloud-startup/).
