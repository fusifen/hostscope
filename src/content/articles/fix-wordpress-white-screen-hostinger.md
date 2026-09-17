---
title: "Fixing the WordPress White Screen of Death on Hostinger"
description: "A blank WordPress page is almost always a hidden fatal PHP error. Turn on WP_DEBUG, raise the memory limit, disable plugins and restore from a backup."
pubDate: 2026-02-13
updatedDate: 2026-09-16
author: "priya-nair"
category: "troubleshooting"
tags: ['wordpress white screen', 'hostinger wordpress', 'php fatal error', 'wordpress memory limit']
primaryKeyword: "wordpress white screen hostinger"
affiliateNotice: true
featured: false
readingTime: 8
relatedPlans: ['premium', 'unlimited', 'cloud-startup']
relatedArticles: ['fix-hostinger-503-error', 'fix-error-establishing-database-connection-hostinger', 'hostinger-website-slow-fix']
steps:
  - name: "Enable WP_DEBUG to reveal the error"
    text: "Edit wp-config.php in the file manager and set WP_DEBUG to true. WordPress will print the fatal error instead of hiding it. Turn it back off once you have the message."
  - name: "Read the error and note the file it names"
    text: "The message names the file and line where execution stopped. That usually identifies the plugin, theme or core file responsible."
  - name: "Raise the PHP memory limit"
    text: "In the site's PHP configuration area in hPanel, raise the memory limit within the plan maximum — 1,536 MB on Premium, 2,048 MB on Unlimited, 3,072 MB on Cloud Startup."
  - name: "Deactivate all plugins via the file manager"
    text: "Rename the wp-content/plugins folder. WordPress deactivates every plugin at once and falls back to a default theme. If the site loads, the cause is a plugin."
  - name: "Switch to a default theme"
    text: "If the site is still blank with plugins disabled, rename the active theme folder so WordPress falls back to a default theme."
  - name: "Replace corrupted core files"
    text: "If the site is still blank with no plugins and a default theme, re-upload a fresh copy of the WordPress core files, keeping wp-content and wp-config.php."
  - name: "Restore from a backup if nothing else works"
    text: "Hostinger Premium includes weekly backups, while Unlimited and above include daily backups with one-click restore. Restore the most recent good copy and re-apply recent changes."
faqs:
  - question: "Why is my WordPress site showing a blank white page?"
    answer: >-
      Almost always because a fatal PHP error occurred and WordPress is
      configured to hide errors rather than display them. The page is not empty
      by design; execution stopped before anything was rendered.
  - question: "How do I see the real error behind a white screen?"
    answer: >-
      Set WP_DEBUG to true in wp-config.php. WordPress will then print the fatal
      error, including the file and line where it happened. Turn it off again
      once you have the message.
  - question: "What is the PHP memory limit on Hostinger plans?"
    answer: >-
      Premium allows 1,536 MB, Unlimited allows 2,048 MB and Cloud Startup
      allows 3,072 MB. You can raise the limit within those maximums from the
      PHP configuration area in hPanel.
  - question: "Does Hostinger have automatic backups?"
    answer: >-
      Yes, but the frequency depends on the plan. Premium includes weekly
      backups. Unlimited and above include daily backups plus a one-click
      restore option.
  - question: "How do I disable plugins if I cannot access the WordPress admin?"
    answer: >-
      Use the file manager in hPanel to rename the wp-content/plugins folder.
      WordPress cannot find the plugins, so it deactivates all of them and the
      site loads again.
  - question: "Can a plugin update cause the white screen?"
    answer: >-
      Yes, it is one of the most common causes. A plugin that is incompatible
      with your PHP version, or a theme that conflicts with a plugin, will
      produce a fatal error immediately after the update.
---

## What is actually happening

A white screen is not a broken site. It is a site that stopped executing before
it produced any output. PHP hit a fatal error, and WordPress is configured not to
display errors to visitors — which is the correct setting for a live site, and
also the reason you cannot see what went wrong.

The fix always has two parts: make the error visible, then fix what it names. If
you skip the first part you will be reinstalling things at random, which is how
a ten-minute problem becomes an evening.

> Never start by reinstalling WordPress. The error message tells you which file
> failed, and in most cases it names a plugin. You lose nothing by looking first
> and a great deal by guessing.

## Step 1: Make the error visible

Edit `wp-config.php` in the file manager in hPanel. Look for the `WP_DEBUG`
line and set it to true. If the line does not exist, add it above the line that
says to stop editing.

```php
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', true );
```

Reload the site. Instead of a blank page you will get a fatal error message
naming a file and a line number. That message is the whole diagnosis.

Two cautions:

- **Turn it off when you are done.** Debug output on a live site leaks file
  paths and plugin versions to anyone who visits.
- **Do not leave `WP_DEBUG_DISPLAY` on permanently.** On a busy site the
  constant writing to a log file adds load, and on a small plan that is
  measurable.

If you cannot get the site to load even with debugging on, check the error log in
hPanel instead. Hostinger keeps per-site error logs, and a fatal error is written
there whether or not display is enabled.

### Reading the message

The message tells you what you need. A few patterns:

| Error message | What it means |
| --- | --- |
| `Allowed memory size of X bytes exhausted` | PHP memory limit reached |
| `Call to undefined function` | A plugin needs a PHP extension that is not enabled, or an update failed midway |
| `Cannot redeclare function` | Two plugins define the same function |
| `Maximum execution time exceeded` | A request is looping or waiting on an external call |
| `Parse error: syntax error` | A file was corrupted, usually by a partial upload or a bad edit |
| `Failed opening required file` | A plugin or theme file is missing |

## Step 2: Raise the memory limit if that is the error

If the message says memory was exhausted, the fix is a limit change, not a
plugin change. In hPanel, open the website's management area and find the PHP
configuration section. Raise the memory limit within the plan maximum.

| Plan | PHP memory limit | PHP workers | Backups |
| --- | --- | --- | --- |
| Premium | 1,536 MB | 40 | Weekly |
| Unlimited | 2,048 MB | 60 | Daily + easy restore |
| Cloud Startup | 3,072 MB | 100 | Daily + on-demand |
| Cloud Professional | 6,144 MB | 200 | Daily + on-demand |

You can also set a limit from `wp-config.php`, but the server-side maximum wins.
Setting 512 MB in a config file when the plan allows 1,536 MB does not raise
anything; the lower value applies.

If you are already at the plan maximum and still exhausting memory, the plugin
causing it needs to go, or the plan needs to change. A single page that needs
more than 1,536 MB is not a WordPress page — it is a plugin doing something it
should not.

## Step 3: Disable all plugins without the admin

You cannot reach the WordPress admin if the site is white-screening, so you
cannot deactivate plugins from the dashboard. Use the file manager instead.

1. Open the file manager in hPanel and navigate to your site's root directory.
2. Go into `wp-content`.
3. Rename the `plugins` folder to something like `plugins-disabled`.
4. Reload the site.

WordPress looks for plugins in `wp-content/plugins`. When the folder is not
there, it finds no plugins and boots without them. If the site loads, the cause
is a plugin.

To find which one, rename the folder back and then rename individual plugin
folders one at a time, reloading between each. Start with the plugin you updated
most recently — updates cause most of these.

### If the site still does not load

Some themes also run plugin-like code, and a corrupted theme produces the same
symptom. Rename the active theme folder inside `wp-content/themes`. WordPress
will fall back to a default theme, and if the site loads you have found the
culprit.

## Step 4: Rule out the PHP version

A plugin that was written for an older PHP release can throw a fatal error on a
newer one, and vice versa. If you changed the PHP version recently and the white
screen appeared at the same time, that is your answer.

In hPanel's PHP configuration area, set the version back to what it was and
reload. If the site returns, the plugin needs updating before you move the PHP
version forward again.

This is the one case where rolling back is the right first move rather than
diagnosing further. Get the site up, then plan the upgrade.

## Step 5: Replace corrupted core files

If the site is blank with no plugins and a default theme, the WordPress core
itself may be damaged — usually by a partial upload, a failed update, or a file
permission problem.

Download a fresh copy of WordPress, then upload the `wp-admin` and `wp-includes`
folders and the files in the root directory, overwriting what is there. Do not
overwrite `wp-config.php` and do not touch `wp-content` — your uploads, themes
and plugins live there.

Check file permissions afterwards. Directories should generally be writable by
the owner and not world-writable, and files should not be executable unless they
need to be.

## Step 6: Restore from a backup

When you cannot identify the cause and the site needs to be live, restore.

This is where your plan matters, and it is the point people discover too late:

- **Premium includes weekly backups.** If you break something on a Thursday, the
  most recent restore point may be up to six days old. That can mean losing a
  week of content.
- **Unlimited and above include daily backups** plus an easy restore, and Cloud
  Startup adds on-demand backups. A bad plugin update on Monday costs you a day,
  not a week.

Find the backup area in hPanel's file or website management section, select a
restore point, and restore. Then re-apply any changes made since.

> The upgrade from Premium to Unlimited costs $1/mo more on the 48-month term
> and changes backups from weekly to daily. If you run anything that takes
> orders, that dollar is the cheapest insurance on the whole pricing page.

## A recovery checklist

1. Turn on `WP_DEBUG` and read the actual error.
2. Check the error log if display does not work.
3. Raise the PHP memory limit if memory was exhausted.
4. Rename `wp-content/plugins` to disable everything at once.
5. Reactivate plugins in small groups to find the offender.
6. Rename the active theme to rule it out.
7. Roll back the PHP version if it changed recently.
8. Re-upload core files if nothing else explains it.
9. Restore from a backup as the last resort.
10. Turn `WP_DEBUG` off when the site is working.

## Preventing the next one

- **Update on a staging copy first.** Hostinger's plans support staging sites,
  and testing an update there costs nothing.
- **Keep a manual export before major updates.** A database dump plus a file
  archive, downloaded locally.
- **Do not run abandoned plugins.** A plugin that has not been updated in years
  is a white screen waiting for a PHP release to land.
- **Watch the PHP version.** When you move it, do it deliberately rather than
  as part of a bulk change.
- **Stay under about 15 active plugins.** Fewer plugins means fewer fatal errors
  and a smaller surface to debug.

If the symptom is a 503 rather than a blank page, the
[503 error guide](/blog/fix-hostinger-503-error/) covers resource exhaustion,
which is a different problem with a different fix. If the page shows a database
error, start with the
[database connection guide](/blog/fix-error-establishing-database-connection-hostinger/).
And if the site loads but slowly, work through the
[performance checklist](/blog/hostinger-website-slow-fix/). For what changes
between tiers, the [Unlimited plan breakdown](/plans/unlimited/) and the
[full pricing comparison](/pricing/) are the quickest reference.
