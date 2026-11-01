# 公众号互友社

一个清新简约、适配手机与电脑的微信公众号互友网站。访客可以提交公众号名称、领域、简介、二维码和文章链接；投稿成功后立即公开展示。

## 文件结构

- `index.html`：页面结构
- `styles.css`：响应式视觉样式
- `app.js`：前端交互、Supabase 数据读写和图片上传
- `supabase-schema.sql`：数据库、RLS 权限和公开图片桶初始化脚本

## 一、创建 Supabase 项目（免费套餐可先用于测试）

1. 打开 https://supabase.com/ 并登录。
2. 创建一个新 Project，记录项目的 **Project URL** 和 **anon / publishable key**。
3. 进入项目的 **SQL Editor**，新建查询，将 `supabase-schema.sql` 全部内容粘贴进去并执行。
4. 进入 **Project Settings → API**（新版界面可能显示 API Keys），复制 Project URL 和 anon/publishable key。
5. 打开 `app.js`，替换最上方两项：

```js
const SUPABASE_URL = "https://你的项目ID.supabase.co";
const SUPABASE_ANON_KEY = "你的 anon / publishable key";
```

只在前端使用 anon/publishable key。**绝对不要**把 `service_role` / secret key 放进网页代码或公开仓库。

## 二、本地预览

不要直接双击 `index.html`，建议启动一个本地静态服务器：

```bash
python -m http.server 8000
```

浏览器打开 http://localhost:8000

也可以使用 VS Code 的 Live Server 插件。

未配置 Supabase 时，页面会显示演示公众号；投稿功能会提示先完成 Supabase 配置。配置成功后，用户提交的数据和二维码会保存到 Supabase，并对所有访客公开。

## 三、部署到 GitHub Pages

1. 在 GitHub 创建一个 Public repository，例如 `wechat-friend-hub`。
2. 上传本项目中的所有文件（`index.html`、`styles.css`、`app.js`、`supabase-schema.sql`、`README.md`）。
3. 进入仓库 **Settings → Pages**。
4. 在 Build and deployment 中选择 **Deploy from a branch**，Branch 选择 `main` / `/ (root)`，保存。
5. 等待 GitHub Pages 发布，使用页面显示的网址访问。

也可以部署到 Vercel：导入 GitHub 仓库，Framework Preset 选择 Other，Build Command 留空，Output Directory 填 `.`。

## 四、当前功能

- 公众号投稿：名称、领域、作者称呼、简介、二维码图片
- 文章分享：微信文章链接与文章标题
- 互友广场：分类筛选、关键词搜索、二维码查看
- 最近文章：展示用户提交的文章链接
- 统计：公众号数量、文章数量
- 移动端响应式布局
- Supabase 数据库与 Storage 持久化

## 五、上线前必须了解的安全事项

当前按需求设置为“任何人可投稿、投稿立即公开”，匿名访问者无需登录即可写入数据库和上传图片。这意味着可能出现广告、恶意链接、重复投稿或存储滥用。

本项目已经限制二维码图片类型与大小、文章链接域名、主要字段长度，并且没有给匿名用户开放修改/删除权限。但纯前端校验不能抵御自动化垃圾投稿。正式公开推广前，强烈建议增加 Cloudflare Turnstile 验证、服务端限流/审核队列和举报机制；如果继续保持“立即公开”，至少要有管理员定期巡查和删除违规内容。

Supabase anon key 本来就是前端公开 key，安全边界由 RLS 策略提供。请确认 SQL 脚本已执行，并在 Supabase Dashboard 检查 `accounts` 表的 RLS 已启用、Storage 桶为 public。

## 六、常见问题

- **投稿提示 RLS 错误**：重新执行 `supabase-schema.sql`，确认 `accounts` 表与 `public-assets` 桶存在。
- **二维码上传成功但不显示**：确认 Storage 中 `public-assets` 桶为 Public，且公开读取策略已创建。
- **统计数字不显示**：检查 anon 对 `accounts` 的 select policy。
- **微信文章链接**：建议粘贴 `https://mp.weixin.qq.com/s/...` 格式的公开文章链接。
