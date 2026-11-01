/* 公众号互友社
 * 配置 Supabase 后即可启用多人共享数据与二维码存储。
 * 未配置时自动使用本地演示数据，便于预览页面。
 */
const SUPABASE_URL = "https://vdouqpotujskabvcxbat.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yocqqOYqrSoA8n85EYGTMA_XFDcyfOD";
const STORAGE_BUCKET = "public-assets";
const PAGE_SIZE = 12;

const isConfigured = SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("YOUR_") && !SUPABASE_ANON_KEY.includes("YOUR_");
const db = isConfigured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const demoAccounts = [
  {id:"demo-1",name:"慢慢生活研究所",category:"生活",author:"小满",description:"记录日常里微小而确定的幸福，分享生活方式、阅读与城市漫步。",qr_image_url:"",created_at:new Date().toISOString()},
  {id:"demo-2",name:"边界之外",category:"科技",author:"Leo",description:"关注 AI、互联网与新技术趋势，用简单的语言理解复杂的世界。",qr_image_url:"",created_at:new Date(Date.now()-3600000).toISOString()},
  {id:"demo-3",name:"一页财经",category:"财经",author:"阿页",description:"用通俗的方式聊市场、商业和个人成长，不构成投资建议。",qr_image_url:"",created_at:new Date(Date.now()-7200000).toISOString()},
  {id:"demo-4",name:"职场不设限",category:"职场",author:"Mia",description:"关于职场沟通、效率工具和职业成长的真实经验分享。",qr_image_url:"",created_at:new Date(Date.now()-10800000).toISOString()},
  {id:"demo-5",name:"山海之间",category:"旅行",author:"行走的阿树",description:"用文字和照片收藏路上的风景，分享目的地攻略与旅行灵感。",qr_image_url:"",created_at:new Date(Date.now()-14400000).toISOString()},
  {id:"demo-6",name:"读一点点",category:"文化",author:"木子",description:"读书、电影、艺术与那些值得反复回味的句子。",qr_image_url:"",created_at:new Date(Date.now()-18000000).toISOString()}
];
let accounts = [];
let articles = [];
let activeCategory = "全部";
let searchTerm = "";
let offset = 0;
let hasMore = false;
let selectedFile = null;
let localMode = !isConfigured;

const $ = (id) => document.getElementById(id);
const escapeHTML = (value="") => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateLabel = value => { try { return new Intl.DateTimeFormat("zh-CN",{month:"2-digit",day:"2-digit"}).format(new Date(value)); } catch { return ""; } };
const showToast = message => { const el=$("toast"); el.textContent=message; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2600); };
const showError = message => { const el=$("form-error"); el.textContent=message; el.classList.remove("hidden"); };
const hideError = () => $("form-error").classList.add("hidden");

function openModal(){ $("submit-modal").classList.remove("hidden"); document.body.style.overflow="hidden"; hideError(); }
function closeModal(){ $("submit-modal").classList.add("hidden"); document.body.style.overflow=""; }
["open-submit","hero-submit","section-submit","banner-submit","empty-submit"].forEach(id=>$(id)?.addEventListener("click",openModal));
$("close-modal").addEventListener("click",closeModal);
$("submit-modal").addEventListener("click",e=>{if(e.target===$("submit-modal"))closeModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
$("menu-toggle").addEventListener("click",()=>$("main-nav")?.classList.toggle("open"));
$("year").textContent=new Date().getFullYear();

function renderAccountCard(item){
  const initial=escapeHTML((item.name||"友").trim().slice(0,1));
  const avatar=item.avatar_url ? `<img class="account-avatar" src="${escapeHTML(item.avatar_url)}" alt="" loading="lazy">` : `<div class="account-avatar avatar-fallback">${initial}</div>`;
  const qrButton=item.qr_image_url ? `<button class="mini-btn" data-qr="${escapeHTML(item.qr_image_url)}" data-name="${escapeHTML(item.name)}">查看二维码</button>` : `<button class="mini-btn" disabled title="演示资料没有二维码">二维码示例</button>`;
  return `<article class="account-card">
    <div class="account-top">${avatar}<div class="account-title"><h3>${escapeHTML(item.name)}</h3><div class="account-meta">${escapeHTML(item.author||"公众号创作者")} · ${dateLabel(item.created_at)}</div></div><span class="category-tag">${escapeHTML(item.category||"其他")}</span></div>
    <p class="account-desc">${escapeHTML(item.description||"这位创作者还没有填写简介。")}</p>
    <div class="account-footer"><small>欢迎交流 · 友善互助</small><div class="card-actions">${qrButton}</div></div>
  </article>`;
}

function renderAccounts(){
  const grid=$("account-grid");
  const filtered=accounts.filter(a=>{
    const matchCategory=activeCategory==="全部"||a.category===activeCategory;
    const haystack=[a.name,a.description,a.author,a.category].join(" ").toLowerCase();
    return matchCategory&&haystack.includes(searchTerm.toLowerCase());
  });
  grid.innerHTML=filtered.length?filtered.map(renderAccountCard).join():"";
  $("empty-state").classList.toggle("hidden",filtered.length!==0);
  $("load-more").classList.toggle("hidden",!hasMore||searchTerm||activeCategory!=="全部");
  grid.querySelectorAll("[data-qr]").forEach(btn=>btn.addEventListener("click",()=>showQR(btn.dataset.qr,btn.dataset.name)));
}

function showQR(url,name){
  const overlay=document.createElement("div");
  overlay.className="modal-backdrop";
  overlay.innerHTML=`<div class="modal" style="width:min(420px,100%);text-align:center"><button class="icon-button" style="float:right" aria-label="关闭">×</button><h2 style="clear:both;margin:10px 0 5px">${escapeHTML(name)}</h2><p style="color:#829087;font-size:12px">长按二维码识别，或使用微信扫一扫</p><img src="${escapeHTML(url)}" alt="${escapeHTML(name)}公众号二维码" style="max-width:260px;max-height:60vh;object-fit:contain;margin:15px auto"><p style="font-size:10px;color:#9aa59e">请在微信中打开扫一扫</p></div>`;
  overlay.querySelector("button").addEventListener("click",()=>overlay.remove());
  overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

function renderArticles(){
  const grid=$("article-grid");
  if(!articles.length){grid.innerHTML="";$("empty-articles").classList.remove("hidden");return;}
  $("empty-articles").classList.add("hidden");
  grid.innerHTML=articles.slice(0,6).map(a=>`<article class="article-card"><div class="article-type">ARTICLE SHARE · ${escapeHTML(a.category||"文章")}</div><h3>${escapeHTML(a.article_title||"公众号文章分享")}</h3><p>来自「${escapeHTML(a.name||"公众号创作者")}」 · ${dateLabel(a.created_at)}</p><a href="${escapeHTML(a.article_url)}" target="_blank" rel="noopener noreferrer">阅读原文 ↗</a></article>`).join("");
}

async function loadAccounts(reset=true){
  if(reset){offset=0;accounts=[];$("account-grid").innerHTML='<div class="loading-state"><span class="loader"></span> 正在加载创作者…</div>';}
  if(localMode){
    accounts=demoAccounts;
    articles=[];
    renderAccounts();renderArticles();
    $("stat-accounts").textContent="—";$("stat-articles").textContent="—";
    return;
  }
  try{
    let query=db.from("accounts").select("id,name,category,author,description,qr_image_url,avatar_url,created_at").order("created_at",{ascending:false}).range(offset,offset+PAGE_SIZE-1);
    const {data,error}=await query;
    if(error)throw error;
    accounts=reset?(data||[]):accounts.concat(data||[]);
    hasMore=(data||[]).length===PAGE_SIZE;
    offset=accounts.length;
    const {count:accountCount}=await db.from("accounts").select("*",{count:"exact",head:true});
    const {count:articleCount}=await db.from("accounts").select("*",{count:"exact",head:true}).not("article_url","is",null);
    $("stat-accounts").textContent=accountCount??accounts.length;
    $("stat-articles").textContent=articleCount??0;
    renderAccounts();
  }catch(err){
    console.error(err);
    $("account-grid").innerHTML='<div class="loading-state">暂时无法连接数据服务，请检查 Supabase 配置与数据库策略。</div>';
  }
}
async function loadArticles(){
  if(localMode){renderArticles();return;}
  try{
    const {data,error}=await db.from("accounts").select("id,name,category,article_title,article_url,created_at").not("article_url","is",null).order("created_at",{ascending:false}).limit(9);
    if(error)throw error;
    articles=data||[];renderArticles();
  }catch(err){console.error(err);$("article-grid").innerHTML="";}
}

$("category-filters").addEventListener("click",e=>{
  const btn=e.target.closest("[data-category]");if(!btn)return;
  activeCategory=btn.dataset.category;
  $("category-filters").querySelectorAll(".filter-chip").forEach(x=>x.classList.toggle("selected",x===btn));
  renderAccounts();
});
$("search-input").addEventListener("input",e=>{searchTerm=e.target.value.trim();renderAccounts();});
$("load-more").addEventListener("click",()=>loadMore());
async function loadMore(){
  if(localMode||!hasMore)return;
  try{
    const {data,error}=await db.from("accounts").select("id,name,category,author,description,qr_image_url,avatar_url,created_at").order("created_at",{ascending:false}).range(offset,offset+PAGE_SIZE-1);
    if(error)throw error;
    accounts=accounts.concat(data||[]);offset=accounts.length;hasMore=(data||[]).length===PAGE_SIZE;renderAccounts();
  }catch(err){showToast("加载失败，请稍后重试");}
}

$("qr-file").addEventListener("change",e=>{
  const file=e.target.files?.[0];selectedFile=file||null;
  if(!file){$("qr-preview").classList.add("hidden");return;}
  if(!["image/png","image/jpeg","image/webp"].includes(file.type)){showError("请上传 PNG、JPG 或 WEBP 格式的图片。");e.target.value="";selectedFile=null;return;}
  if(file.size>5*1024*1024){showError("二维码图片不能超过 5MB。");e.target.value="";selectedFile=null;return;}
  hideError();
  const reader=new FileReader();reader.onload=()=>{$("qr-preview").src=reader.result;$("qr-preview").classList.remove("hidden");$("qr-drop").querySelector(".upload-placeholder").classList.add("hidden");};reader.readAsDataURL(file);
});

function validWeChatURL(value){
  if(!value)return true;
  try{const u=new URL(value);return u.protocol==="https:"&&["mp.weixin.qq.com","weixin.qq.com"].includes(u.hostname);}catch{return false;}
}
$("submit-form").addEventListener("submit",async e=>{
  e.preventDefault();hideError();
  const form=e.currentTarget;const data=new FormData(form);
  const name=String(data.get("name")||"").trim();
  const category=String(data.get("category")||"");
  const articleUrl=String(data.get("article_url")||"").trim();
  if(!name){showError("请填写公众号名称。");return;}
  if(!selectedFile){showError("请上传公众号二维码图片。");return;}
  if(!validWeChatURL(articleUrl)){showError("文章链接请填写以 https 开头的微信公众平台链接（mp.weixin.qq.com）。");return;}
  if(localMode){showError("网站目前处于预览模式。请先按 README 配置 Supabase 数据库与图片存储，再开放真实投稿。");return;}
  const button=$("publish-button");button.disabled=true;button.innerHTML='<span class="loader"></span> 正在发布…';
  try{
    const safeName=selectedFile.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-80);
    const path=`qr/${crypto.randomUUID()}-${safeName}`;
    const {error:uploadError}=await db.storage.from(STORAGE_BUCKET).upload(path,selectedFile,{cacheControl:"3600",upsert:false,contentType:selectedFile.type});
    if(uploadError)throw uploadError;
    const {data:publicData}=db.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    const payload={
      name,category,author:String(data.get("author")||"").trim()||null,
      description:String(data.get("description")||"").trim()||null,
      qr_image_url:publicData.publicUrl,
      article_url:articleUrl||null,
      article_title:String(data.get("article_title")||"").trim()||null
    };
    const {error:insertError}=await db.from("accounts").insert(payload);
    if(insertError){
      await db.storage.from(STORAGE_BUCKET).remove([path]);
      throw insertError;
    }
    form.reset();selectedFile=null;$("qr-preview").classList.add("hidden");$("qr-drop").querySelector(".upload-placeholder").classList.remove("hidden");
    closeModal();showToast("发布成功！你的公众号已公开展示。");
    activeCategory="全部";searchTerm="";$("search-input").value="";
    $("category-filters").querySelectorAll(".filter-chip").forEach(x=>x.classList.toggle("selected",x.dataset.category==="全部"));
    await loadAccounts(true);await loadArticles();
    location.hash="#explore";
  }catch(err){
    console.error(err);
    let msg=err.message||"未知错误";
    if(msg.includes("row-level security"))msg="数据库权限未正确配置，请检查 README 中的 RLS 策略。";
    showError("发布失败："+msg);
  }finally{button.disabled=false;button.innerHTML='确认发布 <span>→</span>';}
});

loadAccounts(true);loadArticles();
