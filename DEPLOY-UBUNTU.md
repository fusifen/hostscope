# 部署到 Ubuntu 服务器

本文把 HostScope 从 Cloudflare Pages 迁到自管 Ubuntu 服务器（nginx）的完整过程。
适用于 Ubuntu 22.04 LTS 和 24.04 LTS。

---

## 0. 先说清楚架构：它其实很简单

HostScope 是**纯静态站点**：`npm run build` 把整站渲染成 `dist/` 里的
HTML/CSS/JS/图片，220 个文件、约 23 MB。运行期**不需要 Node、不需要进程管理器、
不需要 PM2、不需要 systemd 服务**。nginx 把文件发出去就完了。

所以部署的本质只有两件事：

1. 把 `dist/` 放到服务器的某个目录；
2. 让 nginx 把它发出去，并配好 HTTPS。

### 和 Cloudflare Pages 的三个差异 —— 第二点最要命

| | Cloudflare Pages | Ubuntu + nginx |
|---|---|---|
| 内容更新上线 | push 到 `main` 自动触发构建 | **不会自动上线**，必须你自己触发重建 |
| `public/_headers` | 生效 | **完全无效**，必须改写成 nginx 配置 |
| HTTPS / 缓存 | 平台代管 | 你自己管（certbot） |

**第一个差异要重点理解。** 编辑在 `/admin/` 里改一篇文章，Sveltia 会直接 commit
到 GitHub 的 `main` 分支 —— 但服务器上的 `dist/` 是**不会变的**。
读者看到的还是旧内容，直到你重新构建并同步一次。

这不是 bug，是静态托管的固有行为。解决办法是第 7 节的自动部署：
push 到 `main` → GitHub Actions 构建 → rsync 到服务器。配好之后，
编辑点保存，两三分钟后线上就是新的。

**好消息：`/admin/` 本身不需要任何服务端改造。** Sveltia 是 Git-based CMS，
浏览器直接调 GitHub API，不经你的服务器。它在 nginx 下和在 Cloudflare 下
工作方式完全一样。

> ⚠️ 但迁移到 Ubuntu **不会**修掉 "Sign In with GitHub → Not Found"。
> 那个问题和托管平台无关，只和 `backend.base_url` 有关。详见
> `DEPLOY.md` → "If /admin/ shows a blank or stuck page"。

---

## 1. 服务器准备

以下都以有 sudo 权限的普通用户身份执行。**不要用 root 跑部署。**

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx certbot python3-certbot-nginx rsync curl git
```

### 防火墙

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

`Nginx Full` = 80 + 443。一定要先 `allow OpenSSH` 再 `enable`，否则可能把自己锁在外面。

### 建一个专用部署用户（推荐）

不把网站文件放在某个人的 home 下，也不让部署用 root：

```bash
sudo useradd -r -m -d /var/www/hostscope -s /bin/bash deploy
sudo mkdir -p /var/www/hostscope/releases
sudo chown -R deploy:deploy /var/www/hostscope
```

### 目录约定

```
/var/www/hostscope/
├── releases/           # 每次部署一个带时间戳的子目录
│   ├── 20260921-103000/
│   └── 20260921-151200/
└── current -> releases/20260921-151200/    # 符号链接，nginx 的 root 指向它
```

用符号链接做切换，可以做到**原子上线 + 一键回滚**（第 8 节）。

---

## 2. 构建环境：Node 22

`package.json` 里 `engines.node >= 22.12.0`。Ubuntu 24.04 仓库里的 nodejs 是
18.x，**装出来直接构建失败**。用 NodeSource：

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # 必须 >= v22.12.0
```

验证够了再往下走：

```bash
node -e "const {engines}=require('./package.json'); \
  const ok=process.versions.node.localeCompare('22.12.0',undefined,{numeric:true})>=0; \
  console.log(ok?'OK':'FAIL',process.versions.node)"
```

> **如果你采用"本地构建 + rsync"（第 4 节方式 A），服务器上根本不用装 Node。**
> 运行时是纯静态的，Node 只在构建时需要。

---

## 3. 上线前必须改的一个值

`src/consts.ts` 里的 `SITE.url` 现在是：

```ts
url: 'https://hostscope.io',
```

它会被 `astro.config.mjs` 读走，并决定 canonical URL、sitemap、RSS、
OG 图片地址、JSON-LD。**必须在构建前改成真实域名**，否则上线后
Google 收录的全是打不开的 hostscope.io 链接。

```ts
url: 'https://你的域名',
```

改完确认一下：

```bash
grep -n "url:" src/consts.ts | head -3
```

---

## 4. 首次部署

两种都可行，**推荐方式 A**。

### 方式 A：本地构建，rsync 上传（推荐）

服务器上不用装 Node、不用 clone 仓库、不用装依赖。最快，攻击面也最小。

在本机（Windows 用 Git Bash）：

```bash
cd /g/Project/hostinger/stale-star
npm ci
npm run build                     # 约 1 分钟，产出 dist/

TS=$(date +%Y%m%d-%H%M%S)
rsync -az --delete \
  -e "ssh -o StrictHostKeyChecking=accept-new" \
  dist/ deploy@你的服务器:/var/www/hostscope/releases/$TS/

ssh deploy@你的服务器 \
  "ln -sfn /var/www/hostscope/releases/$TS /var/www/hostscope/current"
```

`--delete` 保证服务器上不会残留上一次的旧文件。
`ln -sfn` 是原子切换 —— 不存在"同步到一半"的中间状态被读者看到。

### 方式 B：在服务器上构建

适合想让服务器自己拉代码、自己构建的场景。

```bash
sudo -iu deploy
git clone https://github.com/fusifen/hostscope.git /var/www/hostscope/src
cd /var/www/hostscope/src
npm ci
npm run build
```

然后把 `dist/` 按方式 A 的步骤 rsync/移动过去即可（同一台机器用 `cp -a`）。

> `npm ci` 会装 devDependencies（astro、tailwind、sharp 都在里面），
> 这是对的 —— 它们是构建期依赖。
> `sharp` 在 x86_64 的 Ubuntu 上有预编译二进制，不需要额外系统库。
> 如果是 arm64 或 Alpine/musl，可能要装 `build-essential` 和 libvips。

---

## 5. nginx 配置

### ⚠️ 两个 nginx 的坑，先记住

**坑一：`add_header` 不会继承。** 在 `server {}` 里写的 `add_header`，
只要某个 `location {}` 里出现了**任何** `add_header`，server 层的就**全部失效**，
只保留 location 里的那几条。这是 nginx 最经典的坑。
所以下面的做法是把安全头抽成 snippet，在每个 location 里都 `include` 一次。

**坑二：`expires` 和 `add_header Cache-Control` 会打架。**
`expires 7d;` 自己就会发出 `Cache-Control: max-age=604800`，
如果同时手写 `add_header Cache-Control`，浏览器会收到**两个**
`Cache-Control` 头。下面只用 `add_header`，不用 `expires`。

### 第一步：安全头 snippet

`/etc/nginx/snippets/hostscope-security.conf`：

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

（这几条就是 `public/_headers` 里 `/*` 段的等价翻译。）

### 第二步：站点配置

`/etc/nginx/sites-available/hostscope`：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name 你的域名 www.你的域名;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name 你的域名 www.你的域名;

    ssl_certificate     /etc/letsencrypt/live/你的域名/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/你的域名/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/hostscope/current;
    index index.html;

    include /etc/nginx/snippets/hostscope-security.conf;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml application/javascript
               application/json image/svg+xml application/xml+rss;

    # ── 缓存策略（对应 public/_headers 的各段）────────────────────
    # Astro 在这里输出内容哈希文件名：内容变了文件名就变，可以永久缓存。
    location ^~ /_astro/ {
        include /etc/nginx/snippets/hostscope-security.conf;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        try_files $uri =404;
    }

    location ^~ /images/ {
        include /etc/nginx/snippets/hostscope-security.conf;
        add_header Cache-Control "public, max-age=604800" always;
        try_files $uri =404;
    }

    location ^~ /og/ {
        include /etc/nginx/snippets/hostscope-security.conf;
        add_header Cache-Control "public, max-age=604800" always;
        try_files $uri =404;
    }

    # CMS 外壳绝不缓存 —— 否则更新后编辑可能还在跑旧版后台。
    location ^~ /admin/ {
        include /etc/nginx/snippets/hostscope-security.conf;
        add_header Cache-Control "no-cache, must-revalidate" always;
        try_files $uri $uri/index.html =404;
    }

    location ~ ^/(sitemap-index\.xml|sitemap-0\.xml|rss\.xml|robots\.txt)$ {
        include /etc/nginx/snippets/hostscope-security.conf;
        add_header Cache-Control "public, max-age=3600" always;
        try_files $uri =404;
    }

    # ── 路由 ────────────────────────────────────────────────────
    # build.format: 'directory' → 每页是 <路径>/index.html
    # trailingSlash: 'ignore'   → 带不带斜杠都要能访问
    location / {
        try_files $uri $uri/index.html $uri.html =404;
    }

    error_page 404 /404.html;
    location = /404.html {
        internal;
        add_header Cache-Control "no-cache" always;
    }
}
```

> **没有 Content-Security-Policy，这是故意的。** Astro 会内联小样式表和
> 交互工具的脚本，CSP 必须照着实际产物逐条测出来。凭空写一条会静默搞坏页面。

### 第三步：启用

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/hostscope /etc/nginx/sites-enabled/
sudo nginx -t              # 必须先过这一步
sudo systemctl reload nginx
```

`nginx -t` 不通过就别 reload。改配置养成这个顺序。

---

## 6. HTTPS（certbot）

DNS 先把域名 A/AAAA 记录指到服务器，**解析生效后再跑**，否则会验证失败。

```bash
sudo certbot --nginx -d 你的域名 -d www.你的域名
```

certbot 会自动改 nginx 配置并配置自动续期。确认续期定时器活着：

```bash
systemctl status certbot.timer
sudo certbot renew --dry-run     # 演练一次
```

---

## 7. 自动部署：push 即上线（强烈建议做）

做完这一步，第 0 节说的"内容改了不上线"问题就消失了。

### 生成部署密钥

```bash
ssh-keygen -t ed25519 -C "gh-actions-deploy" -f ~/.ssh/hostscope_deploy
ssh-copy-id -i ~/.ssh/hostscope_deploy.pub deploy@你的服务器
```

私钥填进 GitHub 仓库的 `Settings → Secrets and variables → Actions`
（Repository secrets）：

| Secret | 值 |
|---|---|
| `SSH_PRIVATE_KEY` | `~/.ssh/hostscope_deploy` 的全部内容 |
| `DEPLOY_HOST` | 服务器 IP 或域名 |
| `DEPLOY_USER` | `deploy` |

### 工作流

`.github/workflows/deploy.yml`：

```yaml
name: Deploy to Ubuntu

on:
  push:
    branches: [main]
  workflow_dispatch:      # 允许在 GitHub 上手动点一次

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22.12.0
          cache: npm

      - run: npm ci
      - run: npm run build

      - name: Publish
        env:
          SSH_KEY:  ${{ secrets.SSH_PRIVATE_KEY }}
          HOST:    ${{ secrets.DEPLOY_HOST }}
          USER:    ${{ secrets.DEPLOY_USER }}
        run: |
          set -euo pipefail
          mkdir -p ~/.ssh
          printf '%s\n' "$SSH_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H "$HOST" >> ~/.ssh/known_hosts

          TS=$(date +%Y%m%d-%H%M%S)
          REL="/var/www/hostscope/releases/$TS"

          rsync -az --delete \
            -e "ssh -i ~/.ssh/deploy_key" \
            dist/ "$USER@$HOST:$REL/"

          ssh -i ~/.ssh/deploy_key "$USER@$HOST" \
            "ln -sfn $REL /var/www/hostscope/current && echo deployed $TS"
```

`node-version` 必须写 `22.12.0` —— 和 `.nvmrc`、`.node-version` 保持一致。
工作流不产生 commit，所以不会有触发自身的死循环。

---

## 8. 回滚与清理

回滚就是把符号链接指回上一个 release，几秒钟的事：

```bash
ssh deploy@你的服务器 'ls -1 /var/www/hostscope/releases | tail -5'
ssh deploy@你的服务器 \
  'ln -sfn /var/www/hostscope/releases/<上一个时间戳> /var/www/hostscope/current'
```

只留最近 5 份，其余删掉（每次 23 MB，不清理会悄悄吃满磁盘）：

```bash
ssh deploy@你的服务器 \
  'cd /var/www/hostscope/releases && ls -1 | sort | head -n -5 | xargs -r rm -rf'
```

---

## 9. 上线后验证清单

逐条跑一遍：

```bash
# 1. 首页和几个关键页面返回 200
curl -sI https://你的域名/            | head -1
curl -sI https://你的域名/plans/unlimited/ | head -1
curl -sI https://你的域名/blog/hostinger-review/ | head -1

# 2. 带不带斜杠都能开（trailingSlash: 'ignore'）
curl -sI https://你的域名/plans/unlimited | head -1

# 3. 404 真的返回 404 状态码，而不是 200
curl -sI https://你的域名/this-does-not-exist/ | head -1

# 4. 哈希资源是 immutable
curl -sI https://你的域名/_astro/*.css 2>/dev/null | grep -i cache-control

# 5. /admin/ 不缓存，且能加载
curl -sI https://你的域名/admin/ | grep -i "cache-control\|HTTP/"

# 6. canonical 指向真实域名，不是 hostscope.io
curl -s https://你的域名/ | grep -o '<link rel="canonical"[^>]*>'

# 7. sitemap 里的 URL 是真实域名
curl -s https://你的域名/sitemap-index.xml
```

**注意缓存。** 浏览器和 CDN 都会缓存，测的时候加上变化的查询串：

```bash
curl -sI "https://你的域名/?nocache=$RANDOM" | head -1
```

还有一条必须手动验证：**在 `/admin/` 里改一个字，保存，等自动部署跑完，
确认线上真的变了。** 这是整条链路唯一真正闭环的验证。

---

## 10. 常见问题

**页面 403 / nginx 报 permission denied**
`deploy` 用户的 home 是 `/var/www/hostscope`，检查权限：
`namei -l /var/www/hostscope/current/index.html`。
每一级目录都要有 `x`（可执行/可进入）权限。

**CSS 没样式，或者 404 一堆 `_astro/*`**
`root` 指错了 —— 应该是 `/var/www/hostscope/current`（符号链接本身），
不是 `releases/<时间戳>`。

**改了 `SITE.url` 但 canonical 没变**
只在服务器上重建是不够的：`SITE.url` 在**构建时**被烘焙进产物。
必须在本机/CI 里带着新值重新 `npm run build`。

**`/admin/` 白屏**
和托管平台无关，按 `DEPLOY.md` 的排查清单走 —— 通常是 bundle 被当成
ES module 加载，或 `sortable_fields` 带 `fields.` 前缀。

**部署后线上没变化**
先排除缓存（加变化的查询串），再去看 Actions 是否真的跑成功了，
最后确认符号链接指到了新 release：
`ssh deploy@主机 'readlink /var/www/hostscope/current'`。

**磁盘慢慢被吃满**
releases 没清理。见第 8 节。

---

## 附：和 Cloudflare Pages 并存

迁移期间可以两边同时跑：Cloudflare Pages 继续服务 `*.pages.dev`，
Ubuntu 服务正式域名。**但 DNS 切过去之前，两边用的是同一个 `main` 分支，
两边都会各自构建** —— 记得两边的 `SITE.url` 要分别设置，或者先停掉
Cloudflare Pages 的自动部署，避免 canonical 指向错误域名被收录。
